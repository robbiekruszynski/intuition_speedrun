'use client'

import { WalletConnect } from './wallet-connect'
import { ThemeToggle } from './theme-toggle'

export function Navbar() {
  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Logo/Brand */}
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Intuition SpeedRun</h1>
        </div>
        
        {/* Wallet Connection and Theme Toggle */}
        <div className="flex items-center gap-4">
          <WalletConnect />
          <ThemeToggle />
        </div>
      </div>
    </nav>
  )
} 