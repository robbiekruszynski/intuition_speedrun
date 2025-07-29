'use client'

import { useEffect, useState } from 'react'
import '@rainbow-me/rainbowkit/styles.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider, http } from 'wagmi'
import { mainnet, sepolia, arbitrum, arbitrumSepolia, base, baseSepolia } from 'wagmi/chains'
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit'

const queryClient = new QueryClient()

function getConfig() {
  return getDefaultConfig({
    appName: 'Intuition SDK Showcase',
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
    chains: [mainnet, sepolia, arbitrum, arbitrumSepolia, base, baseSepolia],
    transports: {
      [mainnet.id]: http(),
      [sepolia.id]: http(),
      [arbitrum.id]: http(),
      [arbitrumSepolia.id]: http(),
      [base.id]: http(),
      [baseSepolia.id]: http(),
    },
  })
}

export function RainbowKitProviderWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <WagmiProvider config={getConfig()}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
} 