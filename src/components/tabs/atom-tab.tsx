'use client'

import { useState } from 'react'
import { useIntuition } from '@/hooks/use-intuition'
import { useAccount, useChainId } from 'wagmi'
import { 
  createAtomFromString, 
  createAtomFromIpfsUri, 
  createAtomFromIpfsUpload,
  createAtomFromThing,
  uploadJsonToPinata,
  getAtom,
  getEthMultiVaultAddressFromChainId
} from '@0xintuition/sdk'
import { 
  getIntuitionConfig, 
  isSupportedNetwork, 
  PINATA_CONFIG 
} from '@/lib/intuition-config'
import { usePublicClient, useWalletClient } from 'wagmi'

export function AtomTab() {
  const [searchQuery, setSearchQuery] = useState('')
  const [createName, setCreateName] = useState('')
  const [createDescription, setCreateDescription] = useState('')
  const [createMethod, setCreateMethod] = useState<'basic' | 'ipfs' | 'rich'>('basic')
  const [ipfsContent, setIpfsContent] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
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
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Search timeout - request took too long')), 30000)
      )
      
      const searchPromise = getAtom(searchQuery)
      
      const atom = await Promise.race([searchPromise, timeoutPromise])
      
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

        const parseAtomContent = (data: any) => {
          if (!data) return { content: 'No content available', type: 'empty' }
          
          if (typeof data === 'string') {
            if (data.startsWith('Qm') && data.length > 40) {
              return { content: data, type: 'ipfs-hash' }
            }
            if (data.startsWith('{') || data.startsWith('[')) {
              try {
                const parsed = JSON.parse(data)
                return { 
                  content: parsed, 
                  type: 'json',
                  name: parsed.name,
                  description: parsed.description,
                  type: parsed.type,
                  createdAt: parsed.createdAt,
                  hasImage: parsed.hasImage,
                  imageUrl: parsed.imageUrl
                }
              } catch {
                return { content: data, type: 'text' }
              }
            }
            return { content: data, type: 'text' }
          }
          
          return { content: data, type: 'object' }
        }

        const atomContent = parseAtomContent(atom.data || atom.label)
        
        const transformedAtom = {
          name: atomContent.name || cleanAtomData(atom.label) || cleanAtomData(atom.data) || 'Unnamed Atom',
          description: atomContent.description || cleanAtomData(atom.data) || cleanAtomData(atom.label) || 'No description available',
          id: atom.term_id?.toString() || searchQuery,
          creator: atom.creator?.label || 'Unknown',
          createdAt: atom.created_at,
          type: getAtomTypeDisplay(atom.type),
          emoji: atom.emoji,
          image: atom.image,
          transactionHash: atom.transaction_hash,
          blockNumber: atom.block_number,
          atomContent: atomContent,
          hasImage: atomContent.hasImage,
          imageUrl: atomContent.imageUrl
        }
        
        setResults([transformedAtom])
      } else {
        setError(`Atom ID ${searchQuery} not found.`)
        setResults([])
      }
    } catch (err) {
      let errorMessage = 'Unknown error'
      if (err instanceof Error) {
        if (err.message.includes('timeout')) {
          errorMessage = 'Search timed out. The request took too long. Please try again.'
        } else if (err.message.includes('network')) {
          errorMessage = 'Network error. Please check your connection and try again.'
        } else {
          errorMessage = err.message
        }
      }
      
      setError(`Failed to search atoms: ${errorMessage}`)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!createName.trim() || !createDescription.trim()) return
    if (!isConnected || !address) {
      setError('Please connect your wallet first')
      return
    }
    if (!isSupportedNetwork(chainId)) {
      setError('Please switch to a supported network (Sepolia, Mumbai, Arbitrum Sepolia, or Base Sepolia)')
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
      const atomData = JSON.stringify({
        name: createName,
        description: createDescription,
        type: 'basic',
        createdAt: new Date().toISOString()
      })
      
      const ethMultiVaultAddress = getEthMultiVaultAddressFromChainId(chainId)
      
      const result = await createAtomFromString(
        {
          walletClient,
          publicClient,
          address: ethMultiVaultAddress
        },
        atomData
      )
      
      const atomId = result.state?.vaultId?.toString() || 
                    result.uri?.split('/').pop() || 
                    result.transactionHash?.slice(0, 8) ||
                    'Unknown'
      
      const newAtom = {
        name: createName,
        description: createDescription,
        id: atomId,
        vaultId: result.state?.vaultId?.toString(),
        createdAt: new Date().toISOString(),
        type: 'basic',
        transactionHash: result.transactionHash,
        uri: result.uri
      }
      
      setResults(prev => [newAtom, ...prev])
      setTransactionHash(result.transactionHash)
      setCreateName('')
      setCreateDescription('')
    } catch (err) {
      setError(`Failed to create atom: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateFromIpfsUri = async () => {
    if (!ipfsContent.trim()) return
    if (!isConnected || !address) {
      setError('Please connect your wallet first')
      return
    }
    if (!isSupportedNetwork(chainId)) {
      setError('Please switch to a supported network (Sepolia, Mumbai, Arbitrum Sepolia, or Base Sepolia)')
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
      const ethMultiVaultAddress = getEthMultiVaultAddressFromChainId(chainId)
      
      const result = await createAtomFromIpfsUri(
        {
          walletClient,
          publicClient,
          address: ethMultiVaultAddress
        },
        ipfsContent as `ipfs://${string}`
      )
      
      const atomId = result.state?.vaultId?.toString() || 
                    result.uri?.split('/').pop() || 
                    result.transactionHash?.slice(0, 8) ||
                    'Unknown'
      
      const newAtom = {
        name: `IPFS Atom - ${Date.now()}`,
        description: `Created from IPFS URI: ${ipfsContent}`,
        id: atomId,
        vaultId: result.state?.vaultId?.toString(),
        createdAt: new Date().toISOString(),
        type: 'ipfs-uri',
        ipfsUri: ipfsContent,
        transactionHash: result.transactionHash,
        uri: result.uri
      }
      
      setResults(prev => [newAtom, ...prev])
      setTransactionHash(result.transactionHash)
      setIpfsContent('')
    } catch (err) {
      setError(`Failed to create atom from IPFS URI: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateFromIpfsUpload = async () => {
    if (!ipfsContent.trim()) return
    if (!isConnected || !address) {
      setError('Please connect your wallet first')
      return
    }
    if (!isSupportedNetwork(chainId)) {
      setError('Please switch to a supported network (Sepolia, Mumbai, Arbitrum Sepolia, or Base Sepolia)')
      return
    }
    if (!walletClient || !publicClient) {
      setError('Wallet client not ready. Please try again.')
      return
    }
    if (!PINATA_CONFIG.apiToken) {
      setError('Pinata API token not configured. Please set NEXT_PUBLIC_PINATA_API_TOKEN in your environment variables.')
      return
    }
    
    setIsLoading(true)
    setError(null)
    setTransactionHash(null)
    
    try {
      const jsonData = {
        name: `IPFS Upload Atom - ${Date.now()}`,
        description: ipfsContent,
        type: 'ipfs-upload',
        createdAt: new Date().toISOString()
      }
      
      const pinataResponse = await uploadJsonToPinata(PINATA_CONFIG.apiToken, jsonData)
      
      const ipfsUri = `ipfs://${pinataResponse.IpfsHash}`
      
      const ethMultiVaultAddress = getEthMultiVaultAddressFromChainId(chainId)
      
      const result = await createAtomFromIpfsUpload(
        {
          walletClient,
          publicClient,
          address: ethMultiVaultAddress,
          pinataApiJWT: PINATA_CONFIG.apiToken
        },
        jsonData
      )
      
      const atomId = result.state?.vaultId?.toString() || 
                    result.uri?.split('/').pop() || 
                    result.transactionHash?.slice(0, 8) ||
                    'Unknown'
      
      const newAtom = {
        name: jsonData.name,
        description: `Created from uploaded IPFS content`,
        id: atomId,
        vaultId: result.state?.vaultId?.toString(),
        createdAt: new Date().toISOString(),
        type: 'ipfs-upload',
        ipfsHash: pinataResponse.IpfsHash,
        content: ipfsContent,
        transactionHash: result.transactionHash,
        uri: result.uri
      }
      
      setResults(prev => [newAtom, ...prev])
      setTransactionHash(result.transactionHash)
      setIpfsContent('')
    } catch (err) {
      setError(`Failed to upload to IPFS and create atom: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
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

  const handleCreateRichAtom = async () => {
    if (!createName.trim() || !createDescription.trim()) return
    if (!isConnected || !address) {
      setError('Please connect your wallet first')
      return
    }
    if (!isSupportedNetwork(chainId)) {
      setError('Please switch to a supported network (Sepolia, Mumbai, Arbitrum Sepolia, or Base Sepolia)')
      return
    }
    if (!walletClient || !publicClient) {
      setError('Wallet client not ready. Please try again.')
      return
    }
    if (!PINATA_CONFIG.apiToken) {
      setError('Pinata API token not configured. Please set NEXT_PUBLIC_PINATA_API_TOKEN in your environment variables.')
      return
    }
    
    setIsLoading(true)
    setError(null)
    setTransactionHash(null)
    
    try {
      let imageIpfsHash = null
      
      if (imageFile) {
        try {
          const formData = new FormData()
          formData.append('file', imageFile)
          
          const metadata = JSON.stringify({
            name: imageFile.name,
            description: `Image for rich atom: ${createName}`,
            attributes: {
              type: 'rich-atom-image',
              atomName: createName
            }
          })
          formData.append('pinataMetadata', metadata)
          
          const uploadResponse = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${PINATA_CONFIG.apiToken}`
            },
            body: formData
          })
          
          if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text()
            throw new Error(`Failed to upload image: ${uploadResponse.status} - ${uploadResponse.statusText}`)
          }
          
          const uploadResult = await uploadResponse.json()
          imageIpfsHash = uploadResult.IpfsHash
        } catch (uploadErr) {
          setError(`Failed to upload image: ${uploadErr instanceof Error ? uploadErr.message : 'Unknown error'}`)
          return
        }
      }
      
      const richData = {
        name: createName,
        description: createDescription,
        type: 'rich-atom',
        createdAt: new Date().toISOString(),
        hasImage: !!imageFile,
        imageIpfsHash: imageIpfsHash,
        imageUrl: imageIpfsHash ? `ipfs://${imageIpfsHash}` : null
      }
      
      const ethMultiVaultAddress = getEthMultiVaultAddressFromChainId(chainId)
      
      const result = await createAtomFromIpfsUpload(
        {
          walletClient,
          publicClient,
          address: ethMultiVaultAddress,
          pinataApiJWT: PINATA_CONFIG.apiToken
        },
        richData
      )
      
      const atomId = result.state?.vaultId?.toString() || 
                    result.uri?.split('/').pop() || 
                    result.transactionHash?.slice(0, 8) ||
                    'Unknown'
      
      const newAtom = {
        name: createName,
        description: createDescription,
        id: atomId,
        vaultId: result.state?.vaultId?.toString(),
        createdAt: new Date().toISOString(),
        type: 'rich-atom',
        hasImage: !!imageFile,
        imageIpfsHash: imageIpfsHash,
        imageUrl: imageIpfsHash ? `ipfs://${imageIpfsHash}` : null,
        metadataIpfsHash: result.ipfsHash,
        metadataUrl: result.ipfsUrl,
        transactionHash: result.transactionHash,
        uri: result.uri
      }
      
      setResults(prev => [newAtom, ...prev])
      setTransactionHash(result.transactionHash)
      setCreateName('')
      setCreateDescription('')
      setImageFile(null)
    } catch (err) {
      setError(`Failed to create rich atom: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Atoms</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Atoms are the fundamental units of knowledge in Intuition. Search existing atoms or create new ones.
        </p>
                {!isConnected ? (
          <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3">
            <p className="text-yellow-700 dark:text-yellow-300 text-sm">⚠️ Please connect your wallet to create atoms</p>
          </div>
        ) : !isSupportedNetwork(chainId) ? (
          <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3">
            <p className="text-red-700 dark:text-red-300 text-sm">❌ Please switch to a supported network: Sepolia, Arbitrum Sepolia, or Base Sepolia</p>
          </div>
        ) : (
          <div className="mt-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3">
            <p className="text-green-700 dark:text-green-300 text-sm">✅ Connected to {getIntuitionConfig(chainId)?.name} - Ready to create atoms!</p>
          </div>
        )}
        
        {/* Transaction Status */}
        {transactionHash && (
          <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
            <p className="text-blue-700 dark:text-blue-300 text-sm">
              🎉 Transaction submitted! Hash: 
              <a 
                href={`${getIntuitionConfig(chainId)?.blockExplorer}/tx/${transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 underline ml-1"
              >
                {transactionHash.slice(0, 10)}...{transactionHash.slice(-8)}
              </a>
            </p>
            <p className="text-blue-600 dark:text-blue-400 text-xs mt-2">
              ⏱️ Your atom will be searchable in 1-5 minutes once it's indexed by the network.
            </p>
          </div>
        )}
      </div>
      


      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Search Atoms</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Enter an atom ID to search for a specific atom in the Intuition network.
          <br />
          <span className="text-xs text-gray-500 dark:text-gray-500">
            Example: Try searching 1 and the results will populate below
            <br />
            <span className="text-orange-600 dark:text-orange-400 font-medium">Note: Newly created atoms may take 1-5 minutes to become searchable.</span>
          </span>
        </p>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Enter atom ID to search..."
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
        
        {error && (
          <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="mt-4">
            <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Results</h4>
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className="bg-white dark:bg-gray-700 p-6 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                  <div className="space-y-4">
                    {/* Main Atom Information */}
                    <div className="border-b border-gray-200 dark:border-gray-600 pb-4">
                      <div className="flex items-center gap-3 mb-3">
                        <h5 className="text-xl font-bold text-gray-900 dark:text-white">{result.name}</h5>
                        {result.type && (
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            result.type === 'Basic Atom' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' :
                            result.type === 'IPFS Reference' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' :
                            result.type === 'IPFS Content' ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300' :
                            result.type === 'Rich Atom' ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300' :
                            result.type === 'Structured Atom' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300' :
                            result.type === 'Account Atom' ? 'bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300' :
                            result.type === 'Contract Atom' ? 'bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300' :
                            'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                          }`}>
                          {result.type}
                        </span>
                        )}
                      </div>
                      {result.description && (
                        <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed">{result.description}</p>
                      )}
                    </div>

                    {/* Key Information Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Atom ID Section */}
                      {result.id && (
                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-2">Atom ID</span>
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

                    {/* Additional Details */}
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                      <h6 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Additional Details</h6>
                      <div className="space-y-1 text-sm">
                        {result.type && (
                          <div className="flex justify-between items-center py-1">
                            <span className="text-gray-600 dark:text-gray-400">Type</span>
                            <span className="text-gray-900 dark:text-gray-100 font-medium">{result.type}</span>
                          </div>
                        )}
                        {result.createdAt && (
                          <div className="flex justify-between items-center py-1">
                            <span className="text-gray-600 dark:text-gray-400">Created</span>
                            <span className="text-gray-900 dark:text-gray-100 font-medium">{new Date(result.createdAt).toLocaleDateString()}</span>
                          </div>
                        )}
                        {result.hasImage && (
                          <div className="flex justify-between items-center py-1">
                            <span className="text-gray-600 dark:text-gray-400">Has Image</span>
                            <span className="text-green-600 dark:text-green-400 font-medium">✅ Yes</span>
                          </div>
                        )}
                        {result.creator && (
                          <div className="flex justify-between items-center py-1">
                            <span className="text-gray-600 dark:text-gray-400">Creator</span>
                            <span className="text-gray-900 dark:text-gray-100 font-medium">{result.creator}</span>
                          </div>
                        )}
                        {result.atomContent?.type === 'ipfs-hash' && (
                          <div className="flex justify-between items-center py-1">
                            <span className="text-gray-600 dark:text-gray-400">IPFS Hash</span>
                            <span className="text-gray-900 dark:text-gray-100 font-mono text-xs">{result.atomContent.content}</span>
                          </div>
                        )}
                        {result.atomContent?.type === 'json' && result.atomContent.content?.type && (
                          <div className="flex justify-between items-center py-1">
                            <span className="text-gray-600 dark:text-gray-400">Content Type</span>
                            <span className="text-gray-900 dark:text-gray-100 font-medium">{result.atomContent.content.type}</span>
                          </div>
                        )}
                        {result.atomContent?.type === 'json' && result.atomContent.content?.createdAt && (
                          <div className="flex justify-between items-center py-1">
                            <span className="text-gray-600 dark:text-gray-400">Content Created</span>
                            <span className="text-gray-900 dark:text-gray-100 font-medium">{new Date(result.atomContent.content.createdAt).toLocaleDateString()}</span>
                          </div>
                        )}
                        {result.imageUrl && (
                          <div className="flex justify-between items-center py-1">
                            <span className="text-gray-600 dark:text-gray-400">Image URL</span>
                            <span className="text-gray-900 dark:text-gray-100 font-mono text-xs">{result.imageUrl}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Atom Content Details */}
                    {result.atomContent && result.atomContent.type !== 'empty' && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                        <h6 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-3">Atom Content Details</h6>
                        {result.atomContent.type === 'json' && (
                          <div className="space-y-2">
                            <div className="bg-white dark:bg-gray-700 p-3 rounded border">
                              <div className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">Structured Data</div>
                              <div className="space-y-1 text-xs">
                                {result.atomContent.content.name && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Name:</span>
                                    <span className="text-gray-900 dark:text-gray-100">{result.atomContent.content.name}</span>
                                  </div>
                                )}
                                {result.atomContent.content.description && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Description:</span>
                                    <span className="text-gray-900 dark:text-gray-100">{result.atomContent.content.description}</span>
                                  </div>
                                )}
                                {result.atomContent.content.type && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Type:</span>
                                    <span className="text-gray-900 dark:text-gray-100">{result.atomContent.content.type}</span>
                                  </div>
                                )}
                                {result.atomContent.content.hasImage && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Has Image:</span>
                                    <span className="text-green-600 dark:text-green-400">✅ Yes</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                        {result.atomContent.type === 'ipfs-hash' && (
                          <div className="bg-white dark:bg-gray-700 p-3 rounded border">
                            <div className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">IPFS Content</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">This atom contains IPFS content with hash:</div>
                            <code className="bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded text-xs font-mono text-blue-600 dark:text-blue-400 block break-all">
                              {result.atomContent.content}
                            </code>
                          </div>
                        )}
                        {result.atomContent.type === 'text' && (
                          <div className="bg-white dark:bg-gray-700 p-3 rounded border">
                            <div className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">Text Content</div>
                            <div className="text-sm text-gray-700 dark:text-gray-300">
                              {result.atomContent.content}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

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
      </div>

   
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Create New Atom</h3>
        <div className="mb-4">
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
            {(['basic', 'ipfs', 'rich'] as const).map((method) => (
              <button
                key={method}
                onClick={() => setCreateMethod(method)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                  createMethod === method
                    ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                {method === 'basic' ? 'Basic' : method === 'ipfs' ? 'IPFS' : 'Rich'}
              </button>
            ))}
          </div>
        </div>

        {createMethod === 'basic' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name
              </label>
              <input
                type="text"
                placeholder="Enter atom name..."
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                placeholder="Enter atom description..."
                value={createDescription}
                onChange={(e) => setCreateDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-700"
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
        ) : createMethod === 'rich' ? (
          <div className="space-y-4">
            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-lg p-4 mb-4">
              <h4 className="text-sm font-semibold text-indigo-800 dark:text-indigo-300 mb-2">🎨 Rich Atom Creation</h4>
              <p className="text-sm text-indigo-700 dark:text-indigo-300 leading-relaxed">
                Create atoms with rich content including images, metadata, and enhanced descriptions.
                The SDK supports uploading images to IPFS and creating atoms with visual content.
              </p>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2">
                <strong>SDK Features:</strong> Image upload to IPFS, rich metadata, enhanced atom types
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name
              </label>
              <input
                type="text"
                placeholder="Enter atom name..."
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                placeholder="Enter atom description..."
                value={createDescription}
                onChange={(e) => setCreateDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Image (Optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-700"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Images will be uploaded to IPFS and pinned for permanent storage
              </p>
            </div>
            <button
              onClick={handleCreateRichAtom}
              disabled={isLoading || !createName.trim() || !createDescription.trim()}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating...' : 'Create Rich Atom'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-4">
              <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">🌐 IPFS Atom Creation</h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                Create atoms from IPFS content in two ways:
              </p>
              <ul className="text-xs text-blue-600 dark:text-blue-400 mt-2 space-y-1">
                <li>• <strong>From IPFS URI:</strong> Use existing content already uploaded to IPFS</li>
                <li>• <strong>Upload & Create:</strong> Upload new content to IPFS and create an atom</li>
              </ul>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                IPFS atoms can contain rich data like images, documents, or complex JSON structures.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                IPFS URI or Content
              </label>
              <textarea
                placeholder="Enter IPFS URI (ipfs://...) or JSON content to upload to IPFS..."
                value={ipfsContent}
                onChange={(e) => setIpfsContent(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-700"
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

      {/* Vaults Parent Section */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Vaults</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Vaults are automatically created when atoms or triples are created. Look up vault information using the atom/triple ID that created the vault.
        </p>
        <div className="mt-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-3">
          <p className="text-orange-700 dark:text-orange-300 text-sm">
            💡 <strong>Vault Information:</strong> Each atom automatically creates a vault that can be used for trading shares and monetizing knowledge. 
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
