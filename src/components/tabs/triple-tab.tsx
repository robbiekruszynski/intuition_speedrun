'use client'

import { useState } from 'react'
import { useIntuition } from '@/hooks/use-intuition'

export function TripleTab() {
  const [searchQuery, setSearchQuery] = useState('')
  const [createSubject, setCreateSubject] = useState('')
  const [createPredicate, setCreatePredicate] = useState('')
  const [createObject, setCreateObject] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  const { intuition } = useIntuition()

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('Searching for triples:', searchQuery)
      
      // Simulate search results for demo purposes
      setResults([
        {
          subject: searchQuery,
          predicate: 'is related to',
          object: 'knowledge graph',
          id: 'demo-triple-1'
        }
      ])
    } catch (err) {
      setError('Failed to search triples')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!createSubject.trim() || !createPredicate.trim() || !createObject.trim()) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('Creating triple:', { 
        subject: createSubject, 
        predicate: createPredicate, 
        object: createObject 
      })
      
      // For demo purposes, we'll simulate triple creation
      const newTriple = {
        subject: createSubject,
        predicate: createPredicate,
        object: createObject,
        id: `demo-triple-${Date.now()}`,
        createdAt: new Date().toISOString()
      }
      
      setResults(prev => [newTriple, ...prev])
      setCreateSubject('')
      setCreatePredicate('')
      setCreateObject('')
    } catch (err) {
      setError('Failed to create triple')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Triples</h2>
        <p className="text-gray-600">
          Triples represent relationships between atoms in the form of Subject-Predicate-Object.
        </p>
      </div>

      {/* Search Section */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Search Triples</h3>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search for triples..."
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
        <h3 className="text-lg font-semibold mb-4">Create New Triple</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <input
                type="text"
                placeholder="Enter subject..."
                value={createSubject}
                onChange={(e) => setCreateSubject(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Predicate
              </label>
              <input
                type="text"
                placeholder="Enter predicate..."
                value={createPredicate}
                onChange={(e) => setCreatePredicate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Object
              </label>
              <input
                type="text"
                placeholder="Enter object..."
                value={createObject}
                onChange={(e) => setCreateObject(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
              />
            </div>
          </div>
          <button
            onClick={handleCreate}
            disabled={isLoading || !createSubject.trim() || !createPredicate.trim() || !createObject.trim()}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating...' : 'Create Triple'}
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
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{result.subject}</span>
                  <span className="text-gray-400">→</span>
                  <span className="font-medium">{result.predicate}</span>
                  <span className="text-gray-400">→</span>
                  <span className="font-medium">{result.object}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 