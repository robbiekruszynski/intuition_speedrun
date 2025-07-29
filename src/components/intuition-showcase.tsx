'use client'

import { useState, useEffect } from 'react'
import { AtomTab } from './tabs/atom-tab'
import { TripleTab } from './tabs/triple-tab'
import { UseCasesTab } from './tabs/use-cases-tab'
import { BatchOperationsTab } from './tabs/batch-operations-tab'
import { WalletConnect } from './wallet-connect'
import { ThemeToggle } from './theme-toggle'

type TabType = 'atoms' | 'triples' | 'use-cases' | 'batch-operations'

const tabs = [
  { id: 'atoms', name: 'Atoms', icon: '' },
  { id: 'batch-operations', name: 'Batch Operations', icon: '' },
  { id: 'triples', name: 'Triples', icon: '' },
  { id: 'use-cases', name: 'Use Cases', icon: '' }
]

export function IntuitionShowcase() {
  const [activeTab, setActiveTab] = useState<TabType>('atoms')
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto p-8">
      
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Intuition SpeedRun
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Explore the Intuition SDK - Create atoms, triples, and discover real-world use cases
          </p>
        </div>

 
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </div>
        </div>

       
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          {activeTab === 'atoms' && <AtomTab />}
          {activeTab === 'triples' && <TripleTab />}
          {activeTab === 'batch-operations' && <BatchOperationsTab />}
          {activeTab === 'use-cases' && <UseCasesTab />}
        </div>
      </div>
    </div>
  )
} 