'use client'

import { useState } from 'react'
import { useIntuition } from '@/hooks/use-intuition'

export function AtomTab() {
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
      console.log('Searching for atom with ID:', searchQuery)
      
      // Try to get the atom using the SDK
      const atom = await intuition.atoms.get(searchQuery)
      
      if (atom) {
        // Transform the SDK response to our UI format
        const transformedAtom = {
          name: atom.label || atom.data || 'Unnamed Atom',
          description: atom.data || atom.label || 'No description available',
          id: atom.term_id?.toString() || searchQuery,
          creator: atom.creator?.label || 'Unknown',
          createdAt: atom.created_at,
          type: atom.type,
          emoji: atom.emoji,
          image: atom.image
        }
        
        setResults([transformedAtom])
      } else {
        setError('Atom not found')
        setResults([])
      }
    } catch (err) {
      setError('Failed to search atoms. Make sure you\'re using a valid atom ID.')
      console.error('Atom search error:', err)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!createName.trim() || !createDescription.trim()) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('Creating atom:', { name: createName, description: createDescription })
      
      // For demo purposes, we'll simulate atom creation
      // In a real implementation, you'd use intuition.atoms.create methods
      const newAtom = {
        name: createName,
        description: createDescription,
        id: `demo-${Date.now()}`,
        createdAt: new Date().toISOString()
      }
      
      setResults(prev => [newAtom, ...prev])
      setCreateName('')
      setCreateDescription('')
    } catch (err) {
      setError('Failed to create atom')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Atoms</h2>
        <p className="text-gray-600">
          Atoms are the fundamental units of knowledge in Intuition. Search existing atoms or create new ones.
        </p>
      </div>

      {/* Search Section */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Search Atoms</h3>
        <p className="text-sm text-gray-600 mb-4">
          Enter an atom ID to search for a specific atom in the Intuition network.
        </p>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Enter atom ID to search..."
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
        
        {/* Search Results - Moved here */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="mt-4">
            <h4 className="text-md font-semibold mb-3">Search Results</h4>
            <div className="space-y-3">
              {results.map((result, index) => (
                <div key={index} className="bg-white p-4 rounded-lg border">
                  <div className="flex items-start gap-3">
                    {result.emoji && (
                      <span className="text-2xl">{result.emoji}</span>
                    )}
                    <div className="flex-1">
                      <h5 className="font-medium">{result.name}</h5>
                      <p className="text-gray-600 text-sm">{result.description}</p>
                      <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-500">
                        {result.id && (
                          <span>ID: {result.id}</span>
                        )}
                        {result.creator && (
                          <span>Creator: {result.creator}</span>
                        )}
                        {result.type && (
                          <span>Type: {result.type}</span>
                        )}
                        {result.createdAt && (
                          <span>Created: {new Date(result.createdAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Section */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Create New Atom</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
                          <input
                type="text"
                placeholder="Enter atom name..."
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
                placeholder="Enter atom description..."
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
            {isLoading ? 'Creating...' : 'Create Atom'}
          </button>
        </div>
      </div>
    </div>
  )
} 