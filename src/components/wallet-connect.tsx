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
      case 137:
        return 'Polygon'
      case 80001:
        return 'Polygon Mumbai'
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
        return '🔵'
      case 11155111:
        return '🧪'
      case 137:
        return '🟣'
      case 80001:
        return '🟣'
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
    <div className="flex flex-col items-center gap-4 p-6">
      <div className="text-center mb-2">
        <p className="text-sm text-gray-600 mb-2">Connect with your preferred method:</p>
        <p className="text-xs text-gray-500">Browser extension • QR code • Mobile wallet</p>
      </div>
      <ConnectButton />
      
      {isConnected && address && (
        <div className="mt-4 bg-white rounded-xl shadow-lg border border-gray-200 min-w-[320px] overflow-hidden">
          {/* Collapsible Header */}
          <button
            onClick={() => setIsWalletInfoOpen(!isWalletInfoOpen)}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3 flex items-center justify-between text-white font-semibold text-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200"
          >
            <span>Connected Wallet</span>
            <span className={`transform transition-transform duration-200 ${isWalletInfoOpen ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>
          
          {/* Collapsible Content */}
          {isWalletInfoOpen && (
            <div className="p-4 space-y-4">
              {/* Address */}
              <div className="flex items-center justify-between">
                <span className="text-gray-600 text-sm font-medium">Address</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-900 font-mono text-sm">{formatAddress(address)}</span>
                </div>
              </div>

              {/* Network */}
              <div className="flex items-center justify-between">
                <span className="text-gray-600 text-sm font-medium">Network</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getNetworkIcon(chainId)}</span>
                  <span className="text-gray-900 text-sm">{getNetworkName(chainId)}</span>
                </div>
              </div>

              {/* Balance */}
              <div className="flex items-center justify-between">
                <span className="text-gray-600 text-sm font-medium">Balance</span>
                <span className="text-gray-900 text-sm font-medium">
                  {balance ? `${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}` : 'Loading...'}
                </span>
              </div>

              {/* Network Switcher */}
              <div className="pt-3 border-t border-gray-100">
                <span className="text-gray-600 text-sm font-medium block mb-2">Switch Network</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 1, name: 'Ethereum', icon: '🔵' },
                    { id: 11155111, name: 'Sepolia', icon: '🧪' },
                    { id: 137, name: 'Polygon', icon: '🟣' },
                    { id: 80001, name: 'Mumbai', icon: '🟣' },
                    { id: 42161, name: 'Arbitrum', icon: '🔷' },
                    { id: 421614, name: 'Arb Sepolia', icon: '🔷' },
                    { id: 8453, name: 'Base', icon: '🔵' },
                    { id: 84532, name: 'Base Sepolia', icon: '🔵' }
                  ].map((network) => (
                    <button
                      key={network.id}
                      onClick={() => handleSwitchNetwork(network.id)}
                      disabled={isSwitching || chainId === network.id}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                        chainId === network.id
                          ? 'bg-purple-100 text-purple-700 border border-purple-200'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                      } ${isSwitching ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span>{network.icon}</span>
                      <span>{network.name}</span>
                    </button>
                  ))}
                </div>
                {isSwitching && (
                  <p className="text-xs text-gray-500 mt-2 text-center">Switching network...</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 