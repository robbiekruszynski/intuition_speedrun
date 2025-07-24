'use client'

import { useState } from 'react'
import { useIntuition } from '@/hooks/use-intuition'
import { useAccount, useChainId } from 'wagmi'
import { 
  batchCreateTripleStatements,
  getTriple,
  getEthMultiVaultAddressFromChainId
} from '@0xintuition/sdk'
import { 
  getIntuitionConfig, 
  isSupportedNetwork
} from '@/lib/intuition-config'
import { usePublicClient, useWalletClient } from 'wagmi'

export function TripleTab() {
  const [searchQuery, setSearchQuery] = useState('')
  const [createSubject, setCreateSubject] = useState('')
  const [createPredicate, setCreatePredicate] = useState('')
  const [createObject, setCreateObject] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [transactionHash, setTransactionHash] = useState<string | null>(null)

  const { intuition } = useIntuition()
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('Searching for triple:', searchQuery)
      
      // This calls the Intuition SDK to fetch triple data
      const triple = await getTriple(searchQuery)
      console.log('SDK response:', triple)
      
      if (triple) {
        const transformedTriple = {
          subject: triple.subject?.label || triple.subject?.data || 'Unknown',
          predicate: triple.predicate?.label || triple.predicate?.data || 'Unknown',
          object: triple.object?.label || triple.object?.data || 'Unknown',
          id: triple.term_id?.toString() || searchQuery,
          transactionHash: triple.transaction_hash,
          blockNumber: triple.block_number,
          creator: triple.creator?.label || 'Unknown',
          createdAt: triple.created_at
        }
        
        console.log('Transformed triple:', transformedTriple)
        setResults([transformedTriple])
      } else {
        setError('Triple not found. Try a different triple ID.')
        setResults([])
      }
    } catch (err) {
      console.error('Triple search error details:', err)
      setError(`Failed to search triples: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!createSubject.trim() || !createPredicate.trim() || !createObject.trim()) return
    if (!isConnected || !address) {
      setError('Please connect your wallet first')
      return
    }
    if (!isSupportedNetwork(chainId)) {
              setError('Please switch to a supported network (Sepolia, Arbitrum Sepolia, or Base Sepolia)')
      return
    }
    if (!walletClient || !publicClient) {
      setError('Wallet client not ready. Please try again.')
      return
    }
    
    setIsLoading(true)
    setError(null)
    setTransactionHash(null)
    
    try {
      console.log('Creating triple:', { 
        subject: createSubject, 
        predicate: createPredicate, 
        object: createObject 
      })
      
      // In a real app, you'd create the subject, predicate, and object atoms first
      // For now we're using placeholder IDs - you'd replace these with actual atom IDs
      const tripleData = [BigInt(1), BigInt(2), BigInt(3)]
      
      // The SDK needs the right contract address for your current network
      const ethMultiVaultAddress = getEthMultiVaultAddressFromChainId(chainId)
      
      // This is where the magic happens - the SDK creates your triple on-chain
      const result = await batchCreateTripleStatements(
        {
          walletClient,
          publicClient,
          address: ethMultiVaultAddress
        },
        [tripleData, tripleData, tripleData]
      )
      
      console.log('Triple creation result:', result)
      
      const newTriple = {
        subject: createSubject,
        predicate: createPredicate,
        object: createObject,
        id: result.state[0]?.vaultId?.toString() || `triple-${Date.now()}`,
        vaultId: result.state[0]?.vaultId?.toString(),
        createdAt: new Date().toISOString(),
        transactionHash: result.transactionHash,
        subjectId: result.state[0]?.subjectId,
        predicateId: result.state[0]?.predicateId,
        objectId: result.state[0]?.objectId
      }
      
      setResults(prev => [newTriple, ...prev])
      setTransactionHash(result.transactionHash)
      setCreateSubject('')
      setCreatePredicate('')
      setCreateObject('')
    } catch (err) {
      setError(`Failed to create triple: ${err instanceof Error ? err.message : 'Unknown error'}`)
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
        <div className="mt-2 bg-orange-50 border border-orange-200 rounded-lg p-3">
          <p className="text-orange-700 text-sm">
            💡 <strong>Vault Information:</strong> Each triple automatically creates a vault that can be used for trading shares and monetizing knowledge relationships. 
            Vault IDs are displayed in the results below.
          </p>
        </div>
        
 
        {!isConnected ? (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-yellow-700 text-sm">⚠️ Please connect your wallet to create triples</p>
          </div>
        ) : !isSupportedNetwork(chainId) ? (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-700 text-sm">❌ Please switch to a supported network: Sepolia, Arbitrum Sepolia, or Base Sepolia</p>
          </div>
        ) : (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-green-700 text-sm">✅ Connected to {getIntuitionConfig(chainId)?.name} - Ready to create triples!</p>
          </div>
        )}
        
 
        {transactionHash && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-blue-700 text-sm">
              🎉 Triple transaction submitted! Hash: 
              <a 
                href={`${getIntuitionConfig(chainId)?.blockExplorer}/tx/${transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline ml-1"
              >
                {transactionHash.slice(0, 10)}...{transactionHash.slice(-8)}
              </a>
            </p>
          </div>
        )}
      </div>

 
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

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Results</h3>
          <div className="space-y-4">
            {results.map((result, index) => (
              <div key={index} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <div className="space-y-4">
            
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-center gap-3 text-lg">
                      <div className="bg-white px-4 py-2 rounded-lg border shadow-sm">
                        <span className="font-semibold text-purple-700">{result.subject}</span>
                      </div>
                      <span className="text-2xl text-gray-400">→</span>
                      <div className="bg-white px-4 py-2 rounded-lg border shadow-sm">
                        <span className="font-semibold text-blue-700">{result.predicate}</span>
                      </div>
                      <span className="text-2xl text-gray-400">→</span>
                      <div className="bg-white px-4 py-2 rounded-lg border shadow-sm">
                        <span className="font-semibold text-green-700">{result.object}</span>
                      </div>
                    </div>
                  </div>

                
                  {result.id && (
                    <div className="bg-gray-50 p-3 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Triple ID:</span>
                        <div className="flex items-center gap-2">
                          <code className="bg-white px-3 py-1 rounded border text-sm font-mono text-purple-600">
                            {result.id}
                          </code>
                          <button
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(result.id)
                                // Optional: Show a brief success indicator
                                const button = event?.target as HTMLButtonElement
                                if (button) {
                                  const originalText = button.textContent
                                  button.textContent = '✅'
                                  setTimeout(() => {
                                    button.textContent = originalText
                                  }, 1000)
                                }
                              } catch (err) {
                                console.error('Failed to copy to clipboard:', err)
                              }
                            }}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            title="Copy Triple ID"
                          >
                            📋
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

               
                  {result.transactionHash && (
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-700">Transaction:</span>
                        <a 
                          href={`${getIntuitionConfig(chainId)?.blockExplorer}/tx/${result.transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 font-mono text-sm hover:underline flex items-center gap-1"
                        >
                          {result.transactionHash.slice(0, 8)}...{result.transactionHash.slice(-6)}
                          <span className="text-xs">🔗</span>
                        </a>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 text-sm">
                    {result.vaultId && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Vault ID:</span>
                        <span className="text-orange-600 font-mono text-xs">{result.vaultId}</span>
                      </div>
                    )}
                    {result.createdAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Created:</span>
                        <span className="text-gray-900">{new Date(result.createdAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 