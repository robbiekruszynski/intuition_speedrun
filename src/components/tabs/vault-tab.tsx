'use client'

import { useState } from 'react'
import { useIntuition } from '@/hooks/use-intuition'

export function VaultTab() {
  const [searchQuery, setSearchQuery] = useState('')
  const [createName, setCreateName] = useState('')
  const [createDescription, setCreateDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  const { intuition } = useIntuition()

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('Searching for vaults:', searchQuery)
      
      // Simulate search results for demo purposes
      setResults([
        {
          name: searchQuery,
          description: `Vault containing knowledge about "${searchQuery}"`,
          atomCount: 5,
          tripleCount: 12,
          id: 'demo-vault-1'
        }
      ])
    } catch (err) {
      setError('Failed to search vaults')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!createName.trim() || !createDescription.trim()) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('Creating vault:', { name: createName, description: createDescription })
      
      // For demo purposes, we'll simulate vault creation
      const newVault = {
        name: createName,
        description: createDescription,
        atomCount: 0,
        tripleCount: 0,
        id: `demo-vault-${Date.now()}`,
        createdAt: new Date().toISOString()
      }
      
      setResults(prev => [newVault, ...prev])
      setCreateName('')
      setCreateDescription('')
    } catch (err) {
      setError('Failed to create vault')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Vaults</h2>
        <p className="text-gray-600">
          Vaults are collections of atoms and triples that can be shared and monetized.
        </p>
      </div>

      {/* Search Section */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Search Vaults</h3>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search for vaults..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            disabled={isLoading || !searchQuery.trim()}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {/* Create Section */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Create New Vault</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              placeholder="Enter vault name..."
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              placeholder="Enter vault description..."
              value={createDescription}
              onChange={(e) => setCreateDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
            />
          </div>
          <button
            onClick={handleCreate}
            disabled={isLoading || !createName.trim() || !createDescription.trim()}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating...' : 'Create Vault'}
          </button>
        </div>
      </div>

      {/* Results Section */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Results</h3>
          <div className="space-y-3">
            {results.map((result, index) => (
              <div key={index} className="bg-white p-4 rounded-lg border">
                <h4 className="font-medium">{result.name}</h4>
                <p className="text-gray-600 text-sm">{result.description}</p>
                {result.atomCount && (
                  <p className="text-xs text-gray-500 mt-2">
                    {result.atomCount} atoms • {result.tripleCount} triples
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 