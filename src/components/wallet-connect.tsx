'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useBalance, useChainId } from 'wagmi'

export function WalletConnect() {
  const { isConnected, address } = useAccount()
  const chainId = useChainId()
  const { data: balance } = useBalance({
    address,
  })

  const getNetworkName = (chainId: number) => {
    switch (chainId) {
      case 1:
        return 'Ethereum Mainnet'
      case 11155111:
        return 'Sepolia Testnet'
      case 137:
        return 'Polygon'
      case 42161:
        return 'Arbitrum One'
      default:
        return `Chain ID: ${chainId}`
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 p-6">
      <ConnectButton />
      
      {isConnected && address && (
        <div className="mt-4 p-4 bg-gray-100 rounded-lg min-w-[300px]">
          <h3 className="text-lg font-semibold mb-2">Wallet Info</h3>
          <div className="space-y-2 text-sm">
            <p><strong>Address:</strong> {address}</p>
            <p><strong>Network:</strong> {getNetworkName(chainId)}</p>
            <p><strong>Balance:</strong> {balance ? `${balance.formatted} ${balance.symbol}` : 'Loading...'}</p>
          </div>
        </div>
      )}
    </div>
  )
} 