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
  const [vaultLookupId, setVaultLookupId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [transactionHash, setTransactionHash] = useState<string | null>(null)

  const { intuition } = useIntuition()
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  const getTripleTypeDisplay = (type: any) => {
    if (!type) return 'Unknown'
    
    if (typeof type === 'string') {
      switch (type) {
        case 'basic': return 'Basic Triple'
        case 'complex': return 'Complex Triple'
        default: return type
      }
    }
    
    const typeStr = String(type).toLowerCase()
    if (typeStr.includes('basic') || typeStr.includes('simple')) return 'Basic Triple'
    if (typeStr.includes('complex') || typeStr.includes('advanced')) return 'Complex Triple'
    if (typeStr.includes('json') || typeStr.includes('object')) return 'Structured Triple'
    if (typeStr.includes('relationship') || typeStr.includes('link')) return 'Relationship Triple'
    
    return 'Triple'
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('Searching for triple:', searchQuery)
      
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
          createdAt: triple.created_at,
          type: getTripleTypeDisplay(triple.type)
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
      
      const tripleData = [BigInt(1), BigInt(2), BigInt(3)]
      
      const ethMultiVaultAddress = getEthMultiVaultAddressFromChainId(chainId)
      
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

  const handleVaultLookup = async () => {
    if (!vaultLookupId.trim()) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('Looking up vault for triple:', vaultLookupId)
      
      const triple = await getTriple(vaultLookupId)
      
      if (triple) {
        const transformedTriple = {
          subject: triple.subject?.label || triple.subject?.data || 'Unknown',
          predicate: triple.predicate?.label || triple.predicate?.data || 'Unknown',
          object: triple.object?.label || triple.object?.data || 'Unknown',
          id: triple.term_id?.toString() || vaultLookupId,
          vaultId: vaultLookupId,
          transactionHash: triple.transaction_hash,
          blockNumber: triple.block_number,
          creator: triple.creator?.label || 'Unknown',
          createdAt: triple.created_at,
          vaultInfo: triple.term?.vaults ? {
            positionCount: triple.term.vaults.position_count,
            totalShares: triple.term.vaults.total_shares,
            currentSharePrice: triple.term.vaults.current_share_price,
            positionsCount: triple.term.vaults.positions_aggregate?.aggregate?.count || 0
          } : null
        }
        
        setResults([transformedTriple])
      } else {
        setError(`Vault ${vaultLookupId} not found. Note: Vaults are created automatically when atoms or triples are created.`)
        setResults([])
      }
    } catch (err) {
      console.error('Vault lookup error:', err)
      setError(`Failed to lookup vault: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Triples</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Triples represent relationships between atoms in the form of Subject-Predicate-Object.
        </p>
        
 
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



      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Search Triples</h3>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search for triples..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-700"
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

    
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Create New Triple</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Subject
              </label>
              <input
                type="text"
                placeholder="Enter subject..."
                value={createSubject}
                onChange={(e) => setCreateSubject(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Predicate
              </label>
              <input
                type="text"
                placeholder="Enter predicate..."
                value={createPredicate}
                onChange={(e) => setCreatePredicate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Object
              </label>
              <input
                type="text"
                placeholder="Enter object..."
                value={createObject}
                onChange={(e) => setCreateObject(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-700"
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
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Results</h3>
          <div className="space-y-4">
            {results.map((result, index) => (
              <div key={index} className="bg-white dark:bg-gray-700 p-6 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                <div className="space-y-4">
                  {/* Triple Relationship Display */}
                  <div className="bg-gradient-to-r from-purple-50 dark:from-purple-900/20 to-blue-50 dark:to-blue-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
                    <h6 className="text-sm font-semibold text-purple-800 dark:text-purple-300 mb-3 text-center">Triple Relationship</h6>
                    <div className="flex items-center justify-center gap-3 text-lg">
                      <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-lg border shadow-sm">
                        <span className="font-semibold text-purple-700 dark:text-purple-300">{result.subject}</span>
                      </div>
                      <span className="text-2xl text-gray-400">→</span>
                      <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-lg border shadow-sm">
                        <span className="font-semibold text-blue-700 dark:text-blue-300">{result.predicate}</span>
                      </div>
                      <span className="text-2xl text-gray-400">→</span>
                      <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-lg border shadow-sm">
                        <span className="font-semibold text-green-700 dark:text-green-300">{result.object}</span>
                      </div>
                    </div>
                  </div>

                  {/* Key Information Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Triple ID Section */}
                    {result.id && (
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Triple ID</span>
                          <button
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(result.id)
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
                        <code className="bg-white dark:bg-gray-700 px-3 py-2 rounded border text-sm font-mono text-purple-600 dark:text-purple-400 block">
                          {result.id}
                        </code>
                      </div>
                    )}

                    {/* Transaction Section */}
                    {result.transactionHash && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                        <span className="text-sm font-semibold text-blue-700 dark:text-blue-300 block mb-2">Transaction</span>
                        <a 
                          href={`${getIntuitionConfig(chainId)?.blockExplorer}/tx/${result.transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 font-mono text-sm hover:underline flex items-center gap-1"
                        >
                          {result.transactionHash.slice(0, 8)}...{result.transactionHash.slice(-6)}
                          <span className="text-xs">🔗</span>
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Vault Information */}
                  {result.vaultInfo && (
                    <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-700">
                      <h6 className="text-sm font-semibold text-orange-800 dark:text-orange-300 mb-3">Vault Information</h6>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <span className="text-orange-600 dark:text-orange-400 block text-xs font-medium">Positions</span>
                          <span className="text-orange-800 dark:text-orange-200 font-semibold">{result.vaultInfo.positionsCount}</span>
                        </div>
                        <div>
                          <span className="text-orange-600 dark:text-orange-400 block text-xs font-medium">Total Shares</span>
                          <span className="text-orange-800 dark:text-orange-200 font-semibold">{result.vaultInfo.totalShares?.toString() || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-orange-600 dark:text-orange-400 block text-xs font-medium">Share Price</span>
                          <span className="text-orange-800 dark:text-orange-200 font-semibold">{result.vaultInfo.currentSharePrice?.toString() || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-orange-600 dark:text-orange-400 block text-xs font-medium">Vault ID</span>
                          <span className="text-orange-800 dark:text-orange-200 font-mono text-xs">{result.vaultId}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Additional Details */}
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                    <h6 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Additional Details</h6>
                    <div className="space-y-2 text-sm">
                      {result.createdAt && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Created</span>
                          <span className="text-gray-900 dark:text-gray-100 font-medium">{new Date(result.createdAt).toLocaleDateString()}</span>
                        </div>
                      )}
                      {result.creator && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Creator</span>
                          <span className="text-gray-900 dark:text-gray-100 font-medium">{result.creator}</span>
                        </div>
                      )}
                      {result.subjectId && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Subject ID</span>
                          <span className="text-gray-900 dark:text-gray-100 font-mono text-xs">{result.subjectId}</span>
                        </div>
                      )}
                      {result.predicateId && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Predicate ID</span>
                          <span className="text-gray-900 dark:text-gray-100 font-mono text-xs">{result.predicateId}</span>
                        </div>
                      )}
                      {result.objectId && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Object ID</span>
                          <span className="text-gray-900 dark:text-gray-100 font-mono text-xs">{result.objectId}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vaults Parent Section */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Vaults</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Vaults are automatically created when atoms or triples are created. Look up vault information using the atom/triple ID that created the vault.
        </p>
        <div className="mt-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-3">
          <p className="text-orange-700 dark:text-orange-300 text-sm">
            💡 <strong>Vault Information:</strong> Each triple automatically creates a vault that can be used for trading shares and monetizing knowledge relationships. 
            Vault IDs are displayed in the results below.
          </p>
        </div>
      </div>

      {/* Search Vaults Section */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Search Vaults</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Enter an atom/triple ID to lookup vault information in the Intuition network.
        </p>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Enter atom/triple ID to lookup vault..."
            value={vaultLookupId}
            onChange={(e) => setVaultLookupId(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-700"
            onKeyDown={(e) => e.key === 'Enter' && handleVaultLookup()}
          />
          <button
            onClick={handleVaultLookup}
            disabled={isLoading || !vaultLookupId.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Looking up...' : 'Lookup Vault'}
          </button>
        </div>
        
        {error && (
          <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Vault Results */}
        {results.length > 0 && (
          <div className="mt-4">
            <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Results</h4>
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className="bg-white dark:bg-gray-700 p-6 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                  <div className="space-y-4">
                    {/* Vault Information */}
                    {result.vaultInfo && (
                      <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-700">
                        <h6 className="text-sm font-semibold text-orange-800 dark:text-orange-300 mb-3">Vault Information</h6>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <span className="text-orange-600 dark:text-orange-400 block text-xs font-medium">Positions</span>
                            <span className="text-orange-800 dark:text-orange-200 font-semibold">{result.vaultInfo.positionsCount}</span>
                          </div>
                          <div>
                            <span className="text-orange-600 dark:text-orange-400 block text-xs font-medium">Total Shares</span>
                            <span className="text-orange-800 dark:text-orange-200 font-semibold">{result.vaultInfo.totalShares?.toString() || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-orange-600 dark:text-orange-400 block text-xs font-medium">Share Price</span>
                            <span className="text-orange-800 dark:text-orange-200 font-semibold">{result.vaultInfo.currentSharePrice?.toString() || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-orange-600 dark:text-orange-400 block text-xs font-medium">Vault ID</span>
                            <span className="text-orange-800 dark:text-orange-200 font-mono text-xs">{result.vaultId}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Additional Vault Details */}
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                      <h6 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Additional Details</h6>
                      <div className="space-y-2 text-sm">
                        {result.id && (
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Atom/Triple ID</span>
                            <span className="text-gray-900 dark:text-gray-100 font-mono text-xs">{result.id}</span>
                          </div>
                        )}
                        {result.createdAt && (
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Created</span>
                            <span className="text-gray-900 dark:text-gray-100 font-medium">{new Date(result.createdAt).toLocaleDateString()}</span>
                          </div>
                        )}
                        {result.creator && (
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Creator</span>
                            <span className="text-gray-900 dark:text-gray-100 font-medium">{result.creator}</span>
                          </div>
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
    </div>
  )
} 