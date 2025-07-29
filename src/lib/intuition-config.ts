export const SUPPORTED_NETWORKS = [
  {
    id: 1,
    name: 'Ethereum Mainnet',
    chainId: 1,
    testnet: false,
    explorer: 'https://etherscan.io',
    rpcUrl: 'https://eth.llamarpc.com'
  },
  {
    id: 11155111,
    name: 'Sepolia Testnet',
    chainId: 11155111,
    testnet: true,
    explorer: 'https://sepolia.etherscan.io',
    rpcUrl: 'https://rpc.sepolia.org'
  },
  {
    id: 8453,
    name: 'Base Mainnet',
    chainId: 8453,
    testnet: false,
    explorer: 'https://basescan.org',
    rpcUrl: 'https://mainnet.base.org'
  },
  {
    id: 84532,
    name: 'Base Sepolia Testnet',
    chainId: 84532,
    testnet: true,
    explorer: 'https://sepolia.basescan.org',
    rpcUrl: 'https://sepolia.base.org'
  },
  {
    id: 42161,
    name: 'Arbitrum One',
    chainId: 42161,
    testnet: false,
    explorer: 'https://arbiscan.io',
    rpcUrl: 'https://arb1.arbitrum.io/rpc'
  },
  {
    id: 421614,
    name: 'Arbitrum Sepolia',
    chainId: 421614,
    testnet: true,
    explorer: 'https://sepolia.arbiscan.io',
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc'
  }
]

export const DEFAULT_FEES = {
  depositAmount: BigInt(0.001 * 10**18),
  protocolFee: BigInt(0.0001 * 10**18),
  minDeposit: BigInt(0.0001 * 10**18)
}

export const PINATA_CONFIG = {
  apiToken: process.env.NEXT_PUBLIC_PINATA_API_TOKEN || '',
  gateway: 'https://gateway.pinata.cloud/ipfs/'
} 