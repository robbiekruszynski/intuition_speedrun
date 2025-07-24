'use client'

import { useState } from 'react'
import { AtomTab } from './tabs/atom-tab'
import { TripleTab } from './tabs/triple-tab'
import { VaultTab } from './tabs/vault-tab'

type TabType = 'atoms' | 'triples' | 'vaults'

export function IntuitionShowcase() {
  const [activeTab, setActiveTab] = useState<TabType>('atoms')

  const tabs = [
    { id: 'atoms', label: 'Atoms', icon: '⚛️' },
    { id: 'triples', label: 'Triples', icon: '🔗' },
    { id: 'vaults', label: 'Vaults', icon: '🏦' },
  ] as const

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      <div className="max-w-6xl mx-auto p-8">
      
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Intuition SDK Showcase
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Speed Run
          </p>
        </div>

 
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

       
        <div className="bg-white rounded-xl shadow-lg p-6">
          {activeTab === 'atoms' && <AtomTab />}
          {activeTab === 'triples' && <TripleTab />}
          {activeTab === 'vaults' && <VaultTab />}
        </div>
      </div>
    </div>
  )
} 