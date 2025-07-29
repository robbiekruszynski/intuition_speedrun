'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useBalance, useChainId } from 'wagmi'
import { useState } from 'react'

export function WalletConnect() {
  const { isConnected, address } = useAccount()
  const chainId = useChainId()
  const { data: balance } = useBalance({
    address,
  })
  const [isWalletInfoOpen, setIsWalletInfoOpen] = useState(false)

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <div className="flex items-center gap-3">
      <ConnectButton />
      
      {isConnected && address && (
        <div className="relative">
          <button
            onClick={() => setIsWalletInfoOpen(!isWalletInfoOpen)}
            className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{formatAddress(address)}</span>
            <span className="text-sm"></span>
            <span className={`transform transition-transform duration-200 ${isWalletInfoOpen ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>
          
  
          {isWalletInfoOpen && (
            <div className="absolute right-0 top-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 min-w-[280px] z-50">
              <div className="p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400 text-xs font-medium">Network</span>
                  <div className="flex items-center gap-1">
                    <span className="text-sm">🔗</span>
                    <span className="text-gray-900 dark:text-gray-100 text-xs">Chain ID: {chainId}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400 text-xs font-medium">Balance</span>
                  <span className="text-gray-900 dark:text-gray-100 text-xs font-medium">
                    {balance ? `${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}` : 'Loading...'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 