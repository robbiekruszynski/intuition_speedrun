'use client'

import { useState } from 'react'
import { useIntuition } from '@/hooks/use-intuition'
import { useAccount, useChainId } from 'wagmi'
import { 
  batchCreateTripleStatements,
  getTriple,
  getAtom,
  getEthMultiVaultAddressFromChainId,
  createAtomFromString
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
  const [isCreating, setIsCreating] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [transactionHash, setTransactionHash] = useState<string | null>(null)
  const [atomCreationStatus, setAtomCreationStatus] = useState<{
    subject?: { id?: string, status: 'creating' | 'success' | 'error', hash?: string }
    predicate?: { id?: string, status: 'creating' | 'success' | 'error', hash?: string }
    object?: { id?: string, status: 'creating' | 'success' | 'error', hash?: string }
  }>({})
  
  const [useExistingAtoms, setUseExistingAtoms] = useState(false)
  const [existingSubjectId, setExistingSubjectId] = useState('')
  const [existingPredicateId, setExistingPredicateId] = useState('')
  const [existingObjectId, setExistingObjectId] = useState('')

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

  const getAtomTypeDisplay = (type: any) => {
    if (!type) return 'Unknown'
    
    if (typeof type === 'string') {
      switch (type) {
        case 'basic': return 'Basic Atom'
        case 'ipfs-uri': return 'IPFS Reference'
        case 'ipfs-upload': return 'IPFS Content'
        case 'rich-atom': return 'Rich Atom'
        default: return type
      }
    }
    
    const typeStr = String(type).toLowerCase()
    if (typeStr.includes('basic') || typeStr.includes('string')) return 'Basic Atom'
    if (typeStr.includes('ipfs') || typeStr.includes('uri')) return 'IPFS Reference'
    if (typeStr.includes('rich') || typeStr.includes('complex')) return 'Rich Atom'
    if (typeStr.includes('json') || typeStr.includes('object')) return 'Structured Atom'
    if (typeStr.includes('account') || typeStr.includes('wallet')) return 'Account Atom'
    if (typeStr.includes('contract') || typeStr.includes('smart')) return 'Contract Atom'
    
    return 'Atom'
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const triple = await getTriple(searchQuery)
      
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
        
        setResults([transformedTriple])
      } else {
        setError('Triple not found. Try a different triple ID.')
        setResults([])
      }
    } catch (err) {
      setError(`Failed to search triples: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateFromExistingAtoms = async () => {
    if (!existingSubjectId.trim() || !existingPredicateId.trim() || !existingObjectId.trim()) {
      setError('Please enter all three atom IDs')
      return
    }
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
    
    setIsCreating(true)
    setError(null)
    setTransactionHash(null)
    
    try {
      const ethMultiVaultAddress = getEthMultiVaultAddressFromChainId(chainId)
      
      const subjectIdBigInt = BigInt(existingSubjectId)
      const predicateIdBigInt = BigInt(existingPredicateId)
      const objectIdBigInt = BigInt(existingObjectId)
      
      const result = await batchCreateTripleStatements(
        {
          walletClient,
          publicClient,
          address: ethMultiVaultAddress
        },
        [subjectIdBigInt, predicateIdBigInt, objectIdBigInt]
      )
      
      const newTriple = {
        subject: `Atom ${existingSubjectId}`,
        predicate: `Atom ${existingPredicateId}`,
        object: `Atom ${existingObjectId}`,
        id: result.state[0]?.vaultId?.toString() || `triple-${Date.now()}`,
        vaultId: result.state[0]?.vaultId?.toString(),
        createdAt: new Date().toISOString(),
        transactionHash: result.transactionHash,
        subjectId: existingSubjectId,
        predicateId: existingPredicateId,
        objectId: existingObjectId
      }
      
      setResults(prev => [newTriple, ...prev])
      setTransactionHash(result.transactionHash)
      setExistingSubjectId('')
      setExistingPredicateId('')
      setExistingObjectId('')
    } catch (err) {
      try {
        const result = await batchCreateTripleStatements(
          {
            walletClient,
            publicClient,
            address: ethMultiVaultAddress
          },
          [subjectIdBigInt],
          [predicateIdBigInt],
          [objectIdBigInt]
        )
        
        const newTriple = {
          subject: `Atom ${existingSubjectId}`,
          predicate: `Atom ${existingPredicateId}`,
          object: `Atom ${existingObjectId}`,
          id: result.state[0]?.vaultId?.toString() || `triple-${Date.now()}`,
          vaultId: result.state[0]?.vaultId?.toString(),
          createdAt: new Date().toISOString(),
          transactionHash: result.transactionHash,
          subjectId: existingSubjectId,
          predicateId: existingPredicateId,
          objectId: existingObjectId
        }
        
        setResults(prev => [newTriple, ...prev])
        setTransactionHash(result.transactionHash)
        setExistingSubjectId('')
        setExistingPredicateId('')
        setExistingObjectId('')
      } catch (altErr) {
        setError(`Failed to create triple from existing atoms. Tried multiple formats. Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    } finally {
      setIsCreating(false)
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
    
    setIsCreating(true)
    setError(null)
    setTransactionHash(null)
    
    try {
      const ethMultiVaultAddress = getEthMultiVaultAddressFromChainId(chainId)
      
      setAtomCreationStatus({
        subject: { status: 'creating' },
        predicate: { status: 'creating' },
        object: { status: 'creating' }
      })
      
      setAtomCreationStatus(prev => ({ ...prev, subject: { status: 'creating' } }))
      const subjectAtom = await createAtomFromString(
        {
          walletClient,
          publicClient,
          address: ethMultiVaultAddress
        },
        JSON.stringify({
          name: createSubject,
          description: `Subject atom for triple: ${createSubject}`,
          type: 'triple-subject',
          createdAt: new Date().toISOString()
        })
      )
      setAtomCreationStatus(prev => ({ 
        ...prev, 
        subject: { 
          status: 'success', 
          id: subjectAtom.state?.vaultId?.toString(),
          hash: subjectAtom.transactionHash
        } 
      }))
      
      setAtomCreationStatus(prev => ({ ...prev, predicate: { status: 'creating' } }))
      const predicateAtom = await createAtomFromString(
        {
          walletClient,
          publicClient,
          address: ethMultiVaultAddress
        },
        JSON.stringify({
          name: createPredicate,
          description: `Predicate atom for triple: ${createPredicate}`,
          type: 'triple-predicate',
          createdAt: new Date().toISOString()
        })
      )
      setAtomCreationStatus(prev => ({ 
        ...prev, 
        predicate: { 
          status: 'success', 
          id: predicateAtom.state?.vaultId?.toString(),
          hash: predicateAtom.transactionHash
        } 
      }))
      
      setAtomCreationStatus(prev => ({ ...prev, object: { status: 'creating' } }))
      const objectAtom = await createAtomFromString(
        {
          walletClient,
          publicClient,
          address: ethMultiVaultAddress
        },
        JSON.stringify({
          name: createObject,
          description: `Object atom for triple: ${createObject}`,
          type: 'triple-object',
          createdAt: new Date().toISOString()
        })
      )
      setAtomCreationStatus(prev => ({ 
        ...prev, 
        object: { 
          status: 'success', 
          id: objectAtom.state?.vaultId?.toString(),
          hash: objectAtom.transactionHash
        } 
      }))
      
      const subjectId = subjectAtom.state?.vaultId
      const predicateId = predicateAtom.state?.vaultId
      const objectId = objectAtom.state?.vaultId
      
      if (!subjectId || !predicateId || !objectId) {
        throw new Error('Failed to create one or more atoms. Please try again.')
      }
      
      const subjectIdBigInt = typeof subjectId === 'string' ? BigInt(subjectId) : BigInt(subjectId.toString())
      const predicateIdBigInt = typeof predicateId === 'string' ? BigInt(predicateId) : BigInt(predicateId.toString())
      const objectIdBigInt = typeof objectId === 'string' ? BigInt(objectId) : BigInt(objectId.toString())
      

      
      let result
      let lastError = null
      
      try {
        result = await batchCreateTripleStatements(
          {
            walletClient,
            publicClient,
            address: ethMultiVaultAddress
          },
          [subjectIdBigInt],
          [predicateIdBigInt],
          [objectIdBigInt]
        )
      } catch (error) {
        lastError = error
        
        try {
          result = await batchCreateTripleStatements(
            {
              walletClient,
              publicClient,
              address: ethMultiVaultAddress
            },
            [subjectId],
            [predicateId],
            [objectId]
          )
        } catch (stringError) {
          lastError = stringError
          
          try {
            result = await batchCreateTripleStatements(
              {
                walletClient,
                publicClient,
                address: ethMultiVaultAddress
              },
              [Number(subjectId)],
              [Number(predicateId)],
              [Number(objectId)]
            )
          } catch (numberError) {
            lastError = numberError
            
            throw new Error(`Triple creation failed. Your atoms were created successfully with IDs: Subject=${subjectId}, Predicate=${predicateId}, Object=${objectId}. You can use these IDs to create triples manually later. Last error: ${lastError?.message || 'Unknown error'}`)
          }
        }
      }
      
      const newTriple = {
        subject: createSubject,
        predicate: createPredicate,
        object: createObject,
        id: result.state[0]?.vaultId?.toString() || `triple-${Date.now()}`,
        vaultId: result.state[0]?.vaultId?.toString(),
        createdAt: new Date().toISOString(),
        transactionHash: result.transactionHash,
        subjectId: subjectId.toString(),
        predicateId: predicateId.toString(),
        objectId: objectId.toString()
      }
      
      setResults(prev => [newTriple, ...prev])
      setTransactionHash(result.transactionHash)
      setCreateSubject('')
      setCreatePredicate('')
      setCreateObject('')
      setAtomCreationStatus({})
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      
      let userFriendlyError = errorMessage
      if (errorMessage.includes('Cannot read properties of undefined')) {
        userFriendlyError = 'Triple creation failed due to SDK format issue. Your atoms were created successfully and can be used later.'
      } else if (errorMessage.includes('InsufficientBalance')) {
        userFriendlyError = 'Insufficient balance for transaction. Please ensure you have enough tokens for gas fees.'
      } else if (errorMessage.includes('length')) {
        userFriendlyError = 'Triple creation failed due to data format issue. Your atoms were created successfully.'
      }
      
      setError(`Failed to create triple: ${userFriendlyError}`)
      
      if (subjectId && predicateId && objectId) {
        setAtomCreationStatus(prev => ({
          subject: { ...prev.subject, status: 'success', id: subjectId.toString() },
          predicate: { ...prev.predicate, status: 'success', id: predicateId.toString() },
          object: { ...prev.object, status: 'success', id: objectId.toString() }
        }))
        
        const atomIdsMessage = `Your atoms were created successfully with IDs: Subject=${subjectId}, Predicate=${predicateId}, Object=${objectId}. You can use these IDs to create triples manually later.`
      }
    } finally {
      setIsCreating(false)
    }
  }

  const handleVaultLookup = async () => {
    if (!vaultLookupId.trim()) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const atom = await getAtom(vaultLookupId)
      
      if (atom) {
        const cleanAtomData = (data: any) => {
          if (!data) return 'No description available'
          
          if (typeof data === 'string') {
            if (data.startsWith('Qm') && data.length > 40) {
              return 'IPFS Content Available'
            }
            if (data.startsWith('{') || data.startsWith('[')) {
              try {
                const parsed = JSON.parse(data)
                if (parsed.name) return parsed.name
                if (parsed.description) return parsed.description
                return 'Structured Content Available'
              } catch {
                return 'Content Available'
              }
            }
            return data
          }
          
          return 'Content Available'
        }

        const transformedAtom = {
          name: cleanAtomData(atom.label) || cleanAtomData(atom.data) || 'Unnamed Atom',
          description: cleanAtomData(atom.data) || cleanAtomData(atom.label) || 'No description available',
          id: atom.term_id?.toString() || vaultLookupId,
          vaultId: vaultLookupId,
          creator: atom.creator?.label || 'Unknown',
          createdAt: atom.created_at,
          type: getAtomTypeDisplay(atom.type),
          emoji: atom.emoji,
          image: atom.image,
          transactionHash: atom.transaction_hash,
          blockNumber: atom.block_number,
          vaultInfo: atom.term?.vaults ? {
            positionCount: atom.term.vaults.position_count,
            totalShares: atom.term.vaults.total_shares,
            currentSharePrice: atom.term.vaults.current_share_price,
            positionsCount: atom.term.vaults.positions_aggregate?.aggregate?.count || 0,
            vaultAddress: atom.term.vaults.address,
            vaultId: atom.term.vaults.id,
            totalValue: atom.term.vaults.total_value,
            shareSupply: atom.term.vaults.share_supply,
            marketCap: atom.term.vaults.market_cap,
            lastUpdated: atom.term.vaults.last_updated,
            positions: atom.term.vaults.positions,
            tradingVolume: atom.term.vaults.trading_volume,
            priceHistory: atom.term.vaults.price_history
          } : null
        }
        
        setResults([transformedAtom])
      } else {
        setError(`Vault ${vaultLookupId} not found. Note: Vaults are created automatically when atoms or triples are created.`)
        setResults([])
      }
    } catch (err) {
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
        
        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-4">
          <h4 className="text-sm font-semibold text-blue-800 dark:text-white mb-2">📝 How to Create Triples</h4>
          <p className="text-sm text-blue-700 dark:text-white leading-relaxed">
            Triples represent relationships between concepts in the form of <strong>Subject → Predicate → Object</strong>.
            You can either create new atoms or use existing ones:
          </p>
          <div className="mt-3 space-y-2 text-sm text-blue-600 dark:text-white">
            <div><strong>Option 1:</strong> Create new atoms for each component (3 atom signatures + 1 triple signature)</div>
            <div><strong>Option 2:</strong> Use existing atom IDs to create triples (1 triple signature only)</div>
          </div>
          <div className="mt-3 p-2 bg-blue-100 dark:bg-blue-800 rounded text-xs text-blue-700 dark:text-white">
            <strong>Example:</strong> "Alice" → "owns" → "car" creates the relationship "Alice owns car"
          </div>
          <div className="mt-3 space-y-1 text-xs text-blue-600 dark:text-white">
            <div><strong>💡 Tip:</strong> Use existing atoms to save gas fees and avoid creating duplicate atoms</div>
            <div><strong>⚠️ Note:</strong> If creation fails, your atoms are still created and can be used later</div>
          </div>
        </div>
        
        {/* Toggle for using existing atoms */}
        <div className="mb-4">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={useExistingAtoms}
              onChange={(e) => setUseExistingAtoms(e.target.checked)}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Use existing atom IDs (saves gas fees)
            </span>
          </label>
        </div>
        
        {/* Atom Creation Status */}
        {(isCreating || Object.keys(atomCreationStatus).length > 0) && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-4">
            <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-3">
              {isCreating ? '🔄 Creating Atoms...' : '✅ Atoms Created Successfully'}
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-yellow-700 dark:text-yellow-300">Subject Atom:</span>
                <div className="flex items-center gap-2">
                  {atomCreationStatus.subject?.status === 'creating' && (
                    <span className="text-yellow-600 dark:text-yellow-400">⏳ Creating...</span>
                  )}
                  {atomCreationStatus.subject?.status === 'success' && (
                    <span className="text-green-600 dark:text-green-400">✅ Created (ID: {atomCreationStatus.subject.id})</span>
                  )}
                  {atomCreationStatus.subject?.status === 'error' && (
                    <span className="text-red-600 dark:text-red-400">❌ Failed</span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-yellow-700 dark:text-yellow-300">Predicate Atom:</span>
                <div className="flex items-center gap-2">
                  {atomCreationStatus.predicate?.status === 'creating' && (
                    <span className="text-yellow-600 dark:text-yellow-400">⏳ Creating...</span>
                  )}
                  {atomCreationStatus.predicate?.status === 'success' && (
                    <span className="text-green-600 dark:text-green-400">✅ Created (ID: {atomCreationStatus.predicate.id})</span>
                  )}
                  {atomCreationStatus.predicate?.status === 'error' && (
                    <span className="text-red-600 dark:text-red-400">❌ Failed</span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-yellow-700 dark:text-yellow-300">Object Atom:</span>
                <div className="flex items-center gap-2">
                  {atomCreationStatus.object?.status === 'creating' && (
                    <span className="text-yellow-600 dark:text-yellow-400">⏳ Creating...</span>
                  )}
                  {atomCreationStatus.object?.status === 'success' && (
                    <span className="text-green-600 dark:text-green-400">✅ Created (ID: {atomCreationStatus.object.id})</span>
                  )}
                  {atomCreationStatus.object?.status === 'error' && (
                    <span className="text-red-600 dark:text-red-400">❌ Failed</span>
                  )}
                </div>
              </div>
              {!isCreating && Object.keys(atomCreationStatus).length > 0 && (
                <div className="mt-3 p-2 bg-blue-100 dark:bg-blue-800 rounded text-xs text-blue-700 dark:text-blue-300">
                  <strong>💡 Note:</strong> These atoms were created successfully and can be used to create triples manually later, even if the automatic triple creation failed.
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="space-y-4">
          {useExistingAtoms ? (
            <div>
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-semibold text-green-800 dark:text-green-300 mb-2">💰 Using Existing Atoms</h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Enter the atom IDs you want to use for the triple. This saves gas fees by reusing existing atoms.
                </p>
                <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                  <strong>Example:</strong> If you have atoms with IDs 198936, 198937, 198938, you can use them to create a triple.
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Subject Atom ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 198936..."
                    value={existingSubjectId}
                    onChange={(e) => setExistingSubjectId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Predicate Atom ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 198937..."
                    value={existingPredicateId}
                    onChange={(e) => setExistingPredicateId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Object Atom ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 198938..."
                    value={existingObjectId}
                    onChange={(e) => setExistingObjectId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                  />
                </div>
              </div>
              <button
                onClick={handleCreateFromExistingAtoms}
                disabled={isCreating || !existingSubjectId.trim() || !existingPredicateId.trim() || !existingObjectId.trim()}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
              >
                {isCreating ? 'Creating...' : 'Create Triple from Existing Atoms'}
              </button>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Alice, Bitcoin, AI..."
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
                    placeholder="e.g., owns, is_a, created..."
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
                    placeholder="e.g., car, cryptocurrency, algorithm..."
                    value={createObject}
                    onChange={(e) => setCreateObject(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                  />
                </div>
              </div>
              <button
                onClick={handleCreate}
                disabled={isCreating || !createSubject.trim() || !createPredicate.trim() || !createObject.trim()}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? 'Creating...' : 'Create Triple with New Atoms'}
              </button>
            </div>
          )}
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
                  {/* Key Information Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Triple ID Section */}
                    {result.id && (
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-2">Triple ID</span>
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

                  {/* Additional Details */}
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                    <h6 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Additional Details</h6>
                    <div className="space-y-1 text-sm">
                      {result.createdAt && (
                        <div className="flex justify-between items-center py-1">
                          <span className="text-gray-600 dark:text-gray-400">Created</span>
                          <span className="text-gray-900 dark:text-gray-100 font-medium">{new Date(result.createdAt).toLocaleDateString()}</span>
                        </div>
                      )}
                      {result.creator && (
                        <div className="flex justify-between items-center py-1">
                          <span className="text-gray-600 dark:text-gray-400">Creator</span>
                          <span className="text-gray-900 dark:text-gray-100 font-medium">{result.creator}</span>
                        </div>
                      )}
                      {result.subjectId && (
                        <div className="flex justify-between items-center py-1">
                          <span className="text-gray-600 dark:text-gray-400">Subject ID</span>
                          <span className="text-gray-900 dark:text-gray-100 font-mono text-xs">{result.subjectId}</span>
                        </div>
                      )}
                      {result.predicateId && (
                        <div className="flex justify-between items-center py-1">
                          <span className="text-gray-600 dark:text-gray-400">Predicate ID</span>
                          <span className="text-gray-900 dark:text-gray-100 font-mono text-xs">{result.predicateId}</span>
                        </div>
                      )}
                      {result.objectId && (
                        <div className="flex justify-between items-center py-1">
                          <span className="text-gray-600 dark:text-gray-400">Object ID</span>
                          <span className="text-gray-900 dark:text-gray-100 font-mono text-xs">{result.objectId}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Vault Information */}
                  {result.vaultInfo && (
                    <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-700">
                      <h6 className="text-sm font-semibold text-orange-800 dark:text-orange-300 mb-3">Vault Information</h6>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <span className="text-orange-600 dark:text-orange-400 block text-xs font-medium">Positions</span>
                          <span className="text-orange-800 dark:text-orange-200 font-semibold">{result.vaultInfo.positionsCount || result.vaultInfo.positionCount || 0}</span>
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
                        {result.vaultInfo.totalValue && (
                          <div>
                            <span className="text-orange-600 dark:text-orange-400 block text-xs font-medium">Total Value</span>
                            <span className="text-orange-800 dark:text-orange-200 font-semibold">{result.vaultInfo.totalValue.toString()}</span>
                          </div>
                        )}
                        {result.vaultInfo.shareSupply && (
                          <div>
                            <span className="text-orange-600 dark:text-orange-400 block text-xs font-medium">Share Supply</span>
                            <span className="text-orange-800 dark:text-orange-200 font-semibold">{result.vaultInfo.shareSupply.toString()}</span>
                          </div>
                        )}
                        {result.vaultInfo.marketCap && (
                          <div>
                            <span className="text-orange-600 dark:text-orange-400 block text-xs font-medium">Market Cap</span>
                            <span className="text-orange-800 dark:text-orange-200 font-semibold">{result.vaultInfo.marketCap.toString()}</span>
                          </div>
                        )}
                        {result.vaultInfo.tradingVolume && (
                          <div>
                            <span className="text-orange-600 dark:text-orange-400 block text-xs font-medium">Trading Volume</span>
                            <span className="text-orange-800 dark:text-orange-200 font-semibold">{result.vaultInfo.tradingVolume.toString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
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
                      <h6 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Additional Details</h6>
                      <div className="space-y-1 text-sm">
                        {result.id && (
                          <div className="flex justify-between items-center py-1">
                            <span className="text-gray-600 dark:text-gray-400">Atom/Triple ID</span>
                            <span className="text-gray-900 dark:text-gray-100 font-mono text-xs">{result.id}</span>
                          </div>
                        )}
                        {result.createdAt && (
                          <div className="flex justify-between items-center py-1">
                            <span className="text-gray-600 dark:text-gray-400">Created</span>
                            <span className="text-gray-900 dark:text-gray-100 font-medium">{new Date(result.createdAt).toLocaleDateString()}</span>
                          </div>
                        )}
                        {result.creator && (
                          <div className="flex justify-between items-center py-1">
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