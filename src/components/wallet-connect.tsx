'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useBalance, useChainId, useSwitchChain } from 'wagmi'
import { useState } from 'react'

export function WalletConnect() {
  const { isConnected, address } = useAccount()
  const chainId = useChainId()
  const { data: balance } = useBalance({
    address,
  })
  const { switchChain } = useSwitchChain()
  const [isSwitching, setIsSwitching] = useState(false)
  const [isWalletInfoOpen, setIsWalletInfoOpen] = useState(false)

  const getNetworkName = (chainId: number) => {
    switch (chainId) {
      case 1:
        return 'Ethereum Mainnet'
      case 11155111:
        return 'Sepolia Testnet'
      case 42161:
        return 'Arbitrum One'
      case 421614:
        return 'Arbitrum Sepolia'
      case 8453:
        return 'Base'
      case 84532:
        return 'Base Sepolia'
      default:
        return `Chain ID: ${chainId}`
    }
  }

  const getNetworkIcon = (chainId: number) => {
    switch (chainId) {
      case 1:
        return '🔷'
      case 11155111:
        return '🧪'
      case 42161:
        return '🔷'
      case 421614:
        return '🔷'
      case 8453:
        return '🔵'
      case 84532:
        return '🔵'
      default:
        return '🔗'
    }
  }

  const handleSwitchNetwork = async (targetChainId: number) => {
    if (chainId === targetChainId) return
    
    setIsSwitching(true)
    try {
      await switchChain({ chainId: targetChainId })
    } catch (error) {
      console.error('Failed to switch network:', error)
    } finally {
      setIsSwitching(false)
    }
  }

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
            <span className="text-lg">{getNetworkIcon(chainId)}</span>
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
                      <span className="text-sm">{getNetworkIcon(chainId)}</span>
                      <span className="text-gray-900 dark:text-gray-100 text-xs">{getNetworkName(chainId)}</span>
                    </div>
                  </div>

       
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400 text-xs font-medium">Balance</span>
                  <span className="text-gray-900 dark:text-gray-100 text-xs font-medium">
                    {balance ? `${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}` : 'Loading...'}
                  </span>
                </div>

  
                <div className="pt-2 border-t border-gray-100 dark:border-gray-600">
                  <span className="text-gray-600 dark:text-gray-400 text-xs font-medium block mb-2">Switch Network</span>
                  <div className="grid grid-cols-2 gap-1">
                    {[
                      { id: 1, name: 'Ethereum', icon: '🔷' },
                      { id: 42161, name: 'Arbitrum', icon: '🔷' },
                      { id: 8453, name: 'Base', icon: '🔵' },
                      { id: 11155111, name: 'Sepolia', icon: '🧪' },
                      { id: 421614, name: 'Arb Sepolia', icon: '🔷' },
                      { id: 84532, name: 'Base Sepolia', icon: '🔵' }
                    ].map((network) => (
                      <button
                        key={network.id}
                        onClick={() => handleSwitchNetwork(network.id)}
                        disabled={isSwitching || chainId === network.id}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${
                          chainId === network.id
                            ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700'
                            : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                        } ${isSwitching ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <span className="text-xs">{network.icon}</span>
                        <span className="text-xs">{network.name}</span>
                      </button>
                    ))}
                  </div>
                  {isSwitching && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">Switching...</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 