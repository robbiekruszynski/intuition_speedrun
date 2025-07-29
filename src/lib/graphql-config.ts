export interface GraphQLConfig {
  endpoint: string
  network: string
  chainId: number
  isTestnet: boolean
}

export const GRAPHQL_ENDPOINTS: Record<number, GraphQLConfig> = {
  1: {
    endpoint: 'https://api.intuition.systems/graphql',
    network: 'Ethereum Mainnet',
    chainId: 1,
    isTestnet: false
  },
  8453: {
    endpoint: 'https://api.intuition.systems/graphql',
    network: 'Base Mainnet',
    chainId: 8453,
    isTestnet: false
  },
  42161: {
    endpoint: 'https://api.intuition.systems/graphql',
    network: 'Arbitrum One',
    chainId: 42161,
    isTestnet: false
  },
  11155111: {
    endpoint: 'https://testnet-api.intuition.systems/graphql',
    network: 'Sepolia Testnet',
    chainId: 11155111,
    isTestnet: true
  },
  84532: {
    endpoint: 'https://testnet-api.intuition.systems/graphql',
    network: 'Base Sepolia Testnet',
    chainId: 84532,
    isTestnet: true
  },
  421614: {
    endpoint: 'https://testnet-api.intuition.systems/graphql',
    network: 'Arbitrum Sepolia',
    chainId: 421614,
    isTestnet: true
  }
}

export function getGraphQLConfig(chainId: number): GraphQLConfig | undefined {
  return GRAPHQL_ENDPOINTS[chainId]
}

export function isTestnetNetwork(chainId: number): boolean {
  const config = getGraphQLConfig(chainId)
  return config?.isTestnet || false
}

export function isMainnetNetwork(chainId: number): boolean {
  const config = getGraphQLConfig(chainId)
  return config?.isTestnet === false
}

export async function searchAtomWithNetwork(atomId: string, chainId: number, getAtomFunction: (id: string) => Promise<any>): Promise<any> {
  const config = getGraphQLConfig(chainId)

  if (!config) {
    throw new Error(`Unsupported network: ${chainId}`)
  }

  const isTestnet = isTestnetNetwork(chainId)

  try {
    const atom = await getAtomFunction(atomId)

    if (atom) {
      return {
        ...atom,
        _networkContext: {
          searchedOn: config.network,
          chainId: config.chainId,
          isTestnet
        }
      }
    }

    return null
  } catch (error) {
    console.error('Atom search error:', error)

    if (isTestnet) {
      throw new Error(`Search failed. You're searching on a testnet network (Chain ID: ${chainId}). The SDK currently searches mainnet data. This is a known limitation that will be addressed in future updates.`)
    }

    throw error
  }
}

export async function searchTripleWithNetwork(tripleId: string, chainId: number, getTripleFunction: (id: string) => Promise<any>): Promise<any> {
  const config = getGraphQLConfig(chainId)

  if (!config) {
    throw new Error(`Unsupported network: ${chainId}`)
  }

  const isTestnet = isTestnetNetwork(chainId)

  try {
    const triple = await getTripleFunction(tripleId)

    if (triple) {
      return {
        ...triple,
        _networkContext: {
          searchedOn: config.network,
          chainId: config.chainId,
          isTestnet
        }
      }
    }

    return null
  } catch (error) {
    console.error('Triple search error:', error)

    if (isTestnet) {
      throw new Error(`Search failed. You're searching on a testnet network (Chain ID: ${chainId}). The SDK currently searches mainnet data. This is a known limitation that will be addressed in future updates.`)
    }

    throw error
  }
}

export function getNetworkSearchMessage(chainId: number, searchType: 'atom' | 'triple' | 'vault'): string {
  const config = getGraphQLConfig(chainId)
  const isTestnet = isTestnetNetwork(chainId)

  if (isTestnet) {
    return `Note: You're searching on ${config?.network} (Chain ID: ${chainId}). The SDK currently searches mainnet data regardless of your network. This is a known limitation that will be addressed in future updates.`
  }

  return `Searching on ${config?.network} (Chain ID: ${chainId})`
}