'use client'

import { useState } from 'react'
import { useIntuition } from '@/hooks/use-intuition'

export function AtomTab() {
  const [searchQuery, setSearchQuery] = useState('')
  const [createName, setCreateName] = useState('')
  const [createDescription, setCreateDescription] = useState('')
  const [createMethod, setCreateMethod] = useState<'basic' | 'ipfs'>('basic')
  const [ipfsContent, setIpfsContent] = useState('')
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
      console.log('SDK intuition object:', intuition)
      
      // Try to get the atom using the SDK
      const atom = await intuition.atoms.get(searchQuery)
      console.log('SDK response:', atom)
      
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
        
        console.log('Transformed atom:', transformedAtom)
        setResults([transformedAtom])
      } else {
        setError('Atom not found. Try a different atom ID.')
        setResults([])
      }
    } catch (err) {
      console.error('Atom search error details:', err)
      setError(`Failed to search atoms: ${err instanceof Error ? err.message : 'Unknown error'}`)
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
      console.log('Creating basic atom:', { name: createName, description: createDescription })
      
      // For demo purposes, we'll simulate atom creation
      // In a real implementation, you'd use intuition.atoms.create.fromString
      const newAtom = {
        name: createName,
        description: createDescription,
        id: `demo-${Date.now()}`,
        createdAt: new Date().toISOString(),
        type: 'basic'
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

  const handleCreateFromIpfsUri = async () => {
    if (!ipfsContent.trim()) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('Creating atom from IPFS URI:', ipfsContent)
      
      // For demo purposes, we'll simulate IPFS atom creation
      // In a real implementation, you'd use intuition.atoms.create.fromIpfsUri
      const newAtom = {
        name: `IPFS Atom - ${Date.now()}`,
        description: `Created from IPFS URI: ${ipfsContent}`,
        id: `ipfs-${Date.now()}`,
        createdAt: new Date().toISOString(),
        type: 'ipfs-uri',
        ipfsUri: ipfsContent
      }
      
      setResults(prev => [newAtom, ...prev])
      setIpfsContent('')
    } catch (err) {
      setError('Failed to create atom from IPFS URI')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateFromIpfsUpload = async () => {
    if (!ipfsContent.trim()) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('Uploading to IPFS and creating atom:', ipfsContent)
      
      // For demo purposes, we'll simulate IPFS upload and atom creation
      // In a real implementation, you'd use intuition.pinata.uploadJson and intuition.atoms.create.fromIpfsUpload
      const newAtom = {
        name: `IPFS Upload Atom - ${Date.now()}`,
        description: `Created from uploaded IPFS content`,
        id: `ipfs-upload-${Date.now()}`,
        createdAt: new Date().toISOString(),
        type: 'ipfs-upload',
        ipfsHash: `QmDemo${Date.now()}`,
        content: ipfsContent
      }
      
      setResults(prev => [newAtom, ...prev])
      setIpfsContent('')
    } catch (err) {
      setError('Failed to upload to IPFS and create atom')
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
          <br />
          <span className="text-xs text-gray-500">
            Example: Try searching for atom ID "1" or "2" to test the functionality.
          </span>
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
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-medium">{result.name}</h5>
                        {result.type && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            result.type === 'basic' ? 'bg-green-100 text-green-700' :
                            result.type === 'ipfs-uri' ? 'bg-blue-100 text-blue-700' :
                            result.type === 'ipfs-upload' ? 'bg-purple-100 text-purple-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {result.type}
                          </span>
                        )}
                      </div>
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
                        {result.ipfsUri && (
                          <span className="text-blue-600">IPFS URI: {result.ipfsUri}</span>
                        )}
                        {result.ipfsHash && (
                          <span className="text-purple-600">IPFS Hash: {result.ipfsHash}</span>
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
        
        {/* Creation Method Tabs */}
        <div className="mb-4">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {['basic', 'ipfs'].map((method) => (
              <button
                key={method}
                onClick={() => setCreateMethod(method)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                  createMethod === method
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {method === 'basic' ? 'Basic' : 'IPFS'}
              </button>
            ))}
          </div>
        </div>

        {createMethod === 'basic' ? (
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
              {isLoading ? 'Creating...' : 'Create Basic Atom'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                IPFS URI or Content
              </label>
              <textarea
                placeholder="Enter IPFS URI (ipfs://...) or JSON content to upload to IPFS..."
                value={ipfsContent}
                onChange={(e) => setIpfsContent(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreateFromIpfsUri}
                disabled={isLoading || !ipfsContent.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isLoading ? 'Creating...' : 'Create from IPFS URI'}
              </button>
              <button
                onClick={handleCreateFromIpfsUpload}
                disabled={isLoading || !ipfsContent.trim()}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isLoading ? 'Uploading...' : 'Upload to IPFS & Create'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 