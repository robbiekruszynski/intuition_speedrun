// Networks that work with the Intuition SDK - these are the ones you can actually create atoms and triples on
export interface IntuitionConfig {
  chainId: number
  name: string
  rpcUrl: string
  blockExplorer: string
  testnet: boolean
}

export const INTUITION_SUPPORTED_NETWORKS: IntuitionConfig[] = [
  {
    chainId: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://eth.llamarpc.com',
    blockExplorer: 'https://etherscan.io',
    testnet: false
  },
  {
    chainId: 42161,
    name: 'Arbitrum One',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    blockExplorer: 'https://arbiscan.io',
    testnet: false
  },
  {
    chainId: 8453,
    name: 'Base',
    rpcUrl: 'https://mainnet.base.org',
    blockExplorer: 'https://basescan.org',
    testnet: false
  },
  {
    chainId: 11155111,
    name: 'Sepolia Testnet',
    rpcUrl: 'https://rpc.sepolia.org',
    blockExplorer: 'https://sepolia.etherscan.io',
    testnet: true
  },
  {
    chainId: 421614,
    name: 'Arbitrum Sepolia',
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    blockExplorer: 'https://sepolia.arbiscan.io',
    testnet: true
  },
  {
    chainId: 84532,
    name: 'Base Sepolia',
    rpcUrl: 'https://sepolia.base.org',
    blockExplorer: 'https://sepolia.basescan.org',
    testnet: true
  }
]

export function getIntuitionConfig(chainId: number): IntuitionConfig | undefined {
  return INTUITION_SUPPORTED_NETWORKS.find(network => network.chainId === chainId)
}

export function isSupportedNetwork(chainId: number): boolean {
  return INTUITION_SUPPORTED_NETWORKS.some(network => network.chainId === chainId)
}

// These are the default fees when creating atoms - you can adjust these if needed
export const DEFAULT_ATOM_CONFIG = {
  depositAmount: BigInt(0.001 * 10**18),
  protocolFee: BigInt(0.0001 * 10**18),
  minDeposit: BigInt(0.0001 * 10**18),
}

// Pinata setup for uploading files to IPFS - you'll need to get an API token from pinata.cloud
export const PINATA_CONFIG = {
  apiToken: process.env.NEXT_PUBLIC_PINATA_API_TOKEN || '',
  gateway: 'https://gateway.pinata.cloud/ipfs/'
} 