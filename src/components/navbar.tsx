'use client'

import { WalletConnect } from './wallet-connect'

export function Navbar() {
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Logo/Brand */}
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-gray-900">Intuition SDK</h1>
        </div>
        
        {/* Wallet Connection */}
        <div className="flex items-center gap-4">
          <WalletConnect />
        </div>
      </div>
    </nav>
  )
} 