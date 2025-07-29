'use client'

import { useState } from 'react'
import { useIntuition } from '@/hooks/use-intuition'
import { useAccount, useChainId } from 'wagmi'
import { 
  createAtomFromString, 
  createAtomFromIpfsUri, 
  createAtomFromIpfsUpload,
  createAtomFromThing,
  createAtomFromEthereumAccount,
  pinThing,
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
  const [activeAtomTab, setActiveAtomTab] = useState<'create' | 'advanced'>('create')

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

        const atomContent = parseAtomContent((atom as any).data || (atom as any).label)
        
        const transformedAtom = {
          name: atomContent.name || cleanAtomData((atom as any).label) || cleanAtomData((atom as any).data) || 'Unnamed Atom',
          description: atomContent.description || cleanAtomData((atom as any).data) || cleanAtomData((atom as any).label) || 'No description available',
          id: (atom as any).term_id?.toString() || searchQuery,
          creator: (atom as any).creator?.label || 'Unknown',
          createdAt: (atom as any).created_at,
          type: getAtomTypeDisplay((atom as any).type),
          emoji: (atom as any).emoji,
          image: (atom as any).image,
          transactionHash: (atom as any).transaction_hash,
          blockNumber: (atom as any).block_number,
          atomContent: atomContent,
          hasImage: atomContent.hasImage,
          imageUrl: atomContent.imageUrl
        }
        
        setResults([transformedAtom])
      } else {
        setError(`Atom ${searchQuery} not found. Note: You can only search for atoms on mainnet networks.`)
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
      
      const networkConfig = getIntuitionConfig(chainId)
      const isTestnet = networkConfig?.testnet || false
      
      if (isTestnet) {
        errorMessage += `\n\nNote: You're on ${networkConfig?.name}. Testnet searches can be slower and less reliable than mainnet.`
      }
      
      setError(errorMessage)
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
      setError('Please switch to a supported network (Sepolia, Arbitrum Sepolia, or Base Sepolia)')
      return
    }
    if (!walletClient || !publicClient) {
      setError('Wallet client not ready. Please try again.')
      return
    }
    if (!PINATA_CONFIG.apiToken) {
      setError('Pinata API token not configured. Image uploads are not available. Please configure NEXT_PUBLIC_PINATA_API_TOKEN in your .env file.')
      return
    }
    
    if (PINATA_CONFIG.apiToken.length < 100) {
      setError(`Pinata token appears too short (${PINATA_CONFIG.apiToken.length} characters). JWT tokens should be much longer. Please check your .env file.`)
      return
    }
    
    if (PINATA_CONFIG.apiToken.startsWith('eyJ')) {
      setError('Pinata token does not appear to be a valid JWT (should start with "eyJ"). Please check your .env file.')
      return
    }
    
    try {
      const testResponse = await fetch('https://api.pinata.cloud/data/testAuthentication', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${PINATA_CONFIG.apiToken}`
        }
      })
      
      if (!testResponse.ok) {
        const errorText = await testResponse.text()
        console.error('Pinata test failed:', errorText)
        throw new Error(`Pinata authentication failed: ${testResponse.status} - ${errorText}`)
      }
      
    } catch (testErr) {
      console.error('Pinata test error:', testErr)
      setError(`Pinata authentication failed: ${testErr instanceof Error ? testErr.message : 'Unknown error'}. Please check your API token.`)
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
      
      // SDK: Upload JSON to Pinata IPFS
      const pinataResponse = await uploadJsonToPinata(PINATA_CONFIG.apiToken, jsonData)
      
      const ipfsUri = `ipfs://${pinataResponse.IpfsHash}`
      
      const ethMultiVaultAddress = getEthMultiVaultAddressFromChainId(chainId)
      
      // SDK: Create atom from IPFS upload
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
            positionCount: atom.term.vaults[0]?.position_count || 0,
            totalShares: atom.term.vaults[0]?.total_shares || 0,
            currentSharePrice: atom.term.vaults[0]?.current_share_price || 0,
            positionsCount: atom.term.vaults[0]?.positions_aggregate?.aggregate?.count || 0,
            vaultAddress: atom.term.vaults[0]?.address || '',
            vaultId: atom.term.vaults[0]?.id || '',
            totalValue: atom.term.vaults[0]?.total_value || 0,
            shareSupply: atom.term.vaults[0]?.share_supply || 0,
            marketCap: atom.term.vaults[0]?.market_cap || 0,
            lastUpdated: atom.term.vaults[0]?.last_updated || '',
            positions: atom.term.vaults[0]?.positions || [],
            tradingVolume: atom.term.vaults[0]?.trading_volume || 0,
            priceHistory: atom.term.vaults[0]?.price_history || []
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
    if (!imageFile) {
      setError('Please select an image file')
      return
    }
    
    // Check if Pinata API token is configured
    if (!PINATA_CONFIG.apiToken) {
      setError('Pinata API token not configured. Image uploads are not available. Please configure NEXT_PUBLIC_PINATA_API_TOKEN in your .env file.')
      return
    }
    
    if (PINATA_CONFIG.apiToken.length < 100) {
      setError(`Pinata token appears too short (${PINATA_CONFIG.apiToken.length} characters). JWT tokens should be much longer. Please check your .env file.`)
      return
    }
    
    if (PINATA_CONFIG.apiToken.startsWith('eyJ')) {
      setError('Pinata token does not appear to be a valid JWT (should start with "eyJ"). Please check your .env file.')
      return
    }
    
    try {
      const testResponse = await fetch('https://api.pinata.cloud/data/testAuthentication', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${PINATA_CONFIG.apiToken}`
        }
      })
      
      if (!testResponse.ok) {
        const errorText = await testResponse.text()
        console.error('Pinata test failed:', errorText)
        throw new Error(`Pinata authentication failed: ${testResponse.status} - ${errorText}`)
      }
      
    } catch (testErr) {
      console.error('Pinata test error:', testErr)
      setError(`Pinata authentication failed: ${testErr instanceof Error ? testErr.message : 'Unknown error'}. Please check your API token.`)
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
          
          const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${PINATA_CONFIG.apiToken}`
            },
            body: formData
          })
          
          if (!response.ok) {
            const errorText = await response.text()
            console.error('Pinata error response:', errorText)
            
            if (response.status === 403) {
              throw new Error('Pinata API token is invalid or expired. Please check your NEXT_PUBLIC_PINATA_API_TOKEN in .env file.')
            } else if (response.status === 401) {
              throw new Error('Pinata API token is missing or incorrect. Please configure NEXT_PUBLIC_PINATA_API_TOKEN in your .env file.')
            } else {
              throw new Error(`Pinata upload failed: ${response.status} - ${response.statusText}. Response: ${errorText}`)
            }
          }
          
          const result = await response.json()
          imageIpfsHash = result.IpfsHash
        } catch (uploadErr) {
          console.error('Image upload error:', uploadErr)
          throw new Error(`Failed to upload image: ${uploadErr instanceof Error ? uploadErr.message : 'Unknown error'}`)
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
          Create and search for atoms - the fundamental units of knowledge in the Intuition ecosystem.
        </p>
                {!isConnected ? (
          <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3">
            <p className="text-yellow-700 dark:text-yellow-300 text-sm">Please connect your wallet to create atoms</p>
          </div>
        ) : !isSupportedNetwork(chainId) ? (
          <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3">
            <p className="text-red-700 dark:text-red-300 text-sm">Please switch to a supported network</p>
          </div>
        ) : (
          <div className="mt-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3">
            <p className="text-green-700 dark:text-green-300 text-sm">Connected to {getIntuitionConfig(chainId)?.name} - Ready to create atoms!</p>
          </div>
        )}
        
        {transactionHash && (
          <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
            <p className="text-blue-700 dark:text-blue-300 text-sm">
              Atom created successfully! Transaction Hash: {transactionHash}
            </p>
          </div>
        )}
        
        {error && (
          <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3">
            <p className="text-red-700 dark:text-red-300 text-sm">❌ {error}</p>
          </div>
        )}
      </div>

      {/* Search Atoms Section - Moved to Top */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Search Atoms</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          <span>
            Search for atoms by their ID. 
          <br />
            <span className="text-blue-600 dark:text-blue-400 font-medium">Note: You can only search for atoms and triples on mainnet networks.</span>
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
                          <div className="flex justify-between">
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

      {/* Atom Creation Tabs */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
        <div className="flex space-x-1 mb-6">
          <button
            onClick={() => setActiveAtomTab('create')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              activeAtomTab === 'create'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
            }`}
          >
            Create New Atom
          </button>
          <button
            onClick={() => setActiveAtomTab('advanced')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              activeAtomTab === 'advanced'
                ? 'bg-purple-600 text-white'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
            }`}
          >
            Advanced Atom Creation
          </button>
        </div>

        {/* Create New Atom Tab */}
        {activeAtomTab === 'create' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Create New Atom</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Create atoms with different content types. The SDK automatically handles the appropriate creation method based on your input.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter atom name..."
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    placeholder="Enter atom description..."
                    value={createDescription}
                    onChange={(e) => setCreateDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                  />
                </div>

                {/* IPFS Content Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    IPFS Content (Optional)
                  </label>
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                    <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
                      Add IPFS content to your atom. You can provide an existing IPFS URI or JSON content to upload.
                    </p>
                    <textarea
                      placeholder="Enter IPFS URI (ipfs://...) or JSON content to upload to IPFS..."
                      value={ipfsContent}
                      onChange={(e) => setIpfsContent(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-blue-200 dark:border-blue-700 rounded text-sm text-blue-900 dark:text-blue-100 bg-white dark:bg-gray-700"
                    />
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                      IPFS content can include images, documents, or complex JSON structures
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Image (Optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                  />
                </div>

                <button
                  onClick={() => {
                    if (imageFile) {
                      handleCreateRichAtom()
                    } else if (ipfsContent.trim()) {
                      // Check if it's an IPFS URI or JSON content
                      if (ipfsContent.trim().startsWith('ipfs://') || ipfsContent.trim().startsWith('Qm') || ipfsContent.trim().startsWith('bafy')) {
                        handleCreateFromIpfsUri()
                      } else {
                        handleCreateFromIpfsUpload()
                      }
                    } else {
                      handleCreate()
                    }
                  }}
                  disabled={isLoading || !createName.trim() || !createDescription.trim()}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {isLoading ? 'Creating...' : 'Create Atom'}
                </button>
              </div>

              {/* Creation Type Indicator */}
              <div className="mt-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h5 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Atom Content</h5>
                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  {!ipfsContent.trim() && !imageFile && (
                    <p><strong>Text Content:</strong> Name and description</p>
                  )}
                  {ipfsContent.trim() && !imageFile && ipfsContent.trim().startsWith('ipfs://') && (
                    <p><strong>IPFS URI Reference:</strong> Name, description, and existing IPFS URI</p>
                  )}
                  {ipfsContent.trim() && !imageFile && !ipfsContent.trim().startsWith('ipfs://') && (
                    <p><strong>IPFS Upload:</strong> Name, description, and JSON content to upload</p>
                  )}
                  {imageFile && !ipfsContent.trim() && (
                    <p><strong>Image Content:</strong> Name, description, and image</p>
                  )}
                  {ipfsContent.trim() && imageFile && (
                    <p><strong>Rich Content:</strong> Name, description, IPFS content, and image</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Advanced Atom Creation Tab */}
        {activeAtomTab === 'advanced' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Advanced Atom Creation</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Create atoms from Ethereum accounts, things, and pin content to IPFS using advanced SDK methods.
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Create from Ethereum Account */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 flex flex-col h-full">
                  <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">Create from Ethereum Account</h4>
                  <div className="text-xs text-blue-600 dark:text-blue-400 mb-3">
                    SDK: <code>createAtomFromEthereumAccount</code> - Creates an atom representing an Ethereum account.
                  </div>
                  
                  <div className="space-y-3 flex-1">
                    <input
                      type="text"
                      placeholder="Enter Ethereum address (e.g., 0x123...)"
                      className="w-full px-3 py-2 border border-blue-200 dark:border-blue-600 rounded text-sm text-blue-900 dark:text-blue-100 bg-white dark:bg-gray-700"
                      onChange={(e) => setCreateName(e.target.value)}
                    />
                  </div>
                  
                  <button
                    onClick={async () => {
                      if (!createName.trim()) {
                        setError('Please enter an Ethereum address')
                        return
                      }
                      if (!isConnected || !address) {
                        setError('Please connect your wallet first')
                        return
                      }
                      if (!isSupportedNetwork(chainId)) {
                        setError('Please switch to a supported network')
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
                        
                        // SDK: Create atom from Ethereum account
                        const result = await createAtomFromEthereumAccount(
                          {
                            walletClient,
                            publicClient,
                            address: ethMultiVaultAddress
                          },
                          createName as `0x${string}`
                        )
                        
                        const newAtom = {
                          name: 'Ethereum Account Atom',
                          description: `Created from address: ${createName}`,
                          id: result.state?.vaultId?.toString() || `eth-${Date.now()}`,
                          vaultId: result.state?.vaultId?.toString(),
                          address: createName,
                          createdAt: new Date().toISOString(),
                          type: 'ethereum-account',
                          transactionHash: result.transactionHash
                        }
                        
                        setResults(prev => [newAtom, ...prev])
                        setTransactionHash(result.transactionHash)
                        setCreateName('')
                      } catch (err) {
                        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
                        
                        // Handle specific atom exists error
                        if (errorMessage.includes('EthMultiVault_AtomExists')) {
                          const match = errorMessage.match(/\(([^,]+),\s*(\d+)\)/)
                          if (match) {
                            const atomUri = match[1]
                            const atomId = match[2]
                            setError(`Atom already exists! This Ethereum address (${createName}) already has an atom with ID ${atomId}. Try searching for atom ID ${atomId} to view the existing atom.`)
                          } else {
                            setError(`Atom already exists! This Ethereum address (${createName}) already has an atom. Try searching for the existing atom.`)
                          }
                        } else if (errorMessage.includes('Invalid address')) {
                          setError('Invalid Ethereum address format. Please enter a valid 0x-prefixed address.')
                        } else if (errorMessage.includes('insufficient funds')) {
                          setError('Insufficient funds for transaction. Please ensure you have enough ETH for gas fees.')
                        } else {
                          setError(`Failed to create atom from Ethereum account: ${errorMessage}`)
                        }
                      } finally {
                        setIsLoading(false)
                      }
                    }}
                    disabled={isLoading || !createName.trim()}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm mt-auto"
                  >
                    {isLoading ? 'Creating...' : 'Create from ETH Account'}
                  </button>
                </div>

                {/* Create from Thing */}
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 flex flex-col h-full">
                  <h4 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-3">Create from Thing</h4>
                  <div className="text-xs text-green-600 dark:text-green-400 mb-3">
                    SDK: <code>createAtomFromThing</code> - Creates an atom from a "thing" entity.
                  </div>
                  
                  <div className="mb-3 p-3 bg-green-100 dark:bg-green-800 rounded border border-green-200 dark:border-green-600">
                    <div className="text-xs font-semibold text-green-800 dark:text-green-200 mb-2">JSON Format Example:</div>
                    <pre className="text-xs text-green-700 dark:text-green-300 bg-white dark:bg-gray-700 p-2 rounded overflow-x-auto">
{`{
  "name": "My Thing",
  "description": "A thing description",
  "type": "object",
  "properties": {
    "color": "blue",
    "size": "large"
  }
}`}
                    </pre>
                  </div>
                  
                  <div className="space-y-3 flex-1">
                    <textarea
                      placeholder='Enter thing JSON: {"name": "My Thing", "description": "A thing"}'
                      className="w-full px-3 py-2 border border-green-200 dark:border-green-600 rounded text-sm text-green-900 dark:text-green-100 bg-white dark:bg-gray-700"
                      rows={4}
                      onChange={(e) => setCreateDescription(e.target.value)}
                    />
                  </div>
                  
                  <button
                    onClick={async () => {
                      if (!createDescription.trim()) {
                        setError('Please enter thing data')
                        return
                      }
                      if (!isConnected || !address) {
                        setError('Please connect your wallet first')
                        return
                      }
                      if (!isSupportedNetwork(chainId)) {
                        setError('Please switch to a supported network')
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
                        let thing
                        try {
                          thing = JSON.parse(createDescription)
                        } catch (parseError) {
                          setError(`Invalid JSON format. Please check your syntax. Example: {"name": "My Thing", "description": "A thing"}`)
                          setIsLoading(false)
                          return
                        }
                        
                        // Validate required fields
                        if (!thing.name && !thing.description) {
                          setError('JSON must contain at least a "name" or "description" field')
                          setIsLoading(false)
                          return
                        }
                        
                        const ethMultiVaultAddress = getEthMultiVaultAddressFromChainId(chainId)
                        
                        // SDK: Create atom from thing
                        const result = await createAtomFromThing(
                          {
                            walletClient,
                            publicClient,
                            address: ethMultiVaultAddress
                          },
                          thing
                        )
                        
                        const newAtom = {
                          name: 'Thing Atom',
                          description: `Created from thing: ${thing.name || 'Unknown'}`,
                          id: result.state?.vaultId?.toString() || `thing-${Date.now()}`,
                          vaultId: result.state?.vaultId?.toString(),
                          thing: thing,
                          createdAt: new Date().toISOString(),
                          type: 'thing',
                          transactionHash: result.transactionHash
                        }
                        
                        setResults(prev => [newAtom, ...prev])
                        setTransactionHash(result.transactionHash)
                        setCreateDescription('')
                      } catch (err) {
                        setError(`Failed to create atom from thing: ${err instanceof Error ? err.message : 'Unknown error'}`)
                      } finally {
                        setIsLoading(false)
                      }
                    }}
                    disabled={isLoading || !createDescription.trim()}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm mt-auto"
                  >
                    {isLoading ? 'Creating...' : 'Create from Thing'}
                  </button>
                </div>

                {/* Pin Thing to IPFS */}
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4 flex flex-col h-full">
                  <h4 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-3">Pin Thing to IPFS</h4>
                  <div className="text-xs text-purple-600 dark:text-purple-400 mb-3">
                    SDK: <code>pinThing</code> - Pins a thing to IPFS using Pinata.
                  </div>
                  
                  <div className="mb-3 p-3 bg-purple-100 dark:bg-purple-800 rounded border border-purple-200 dark:border-purple-600">
                    <div className="text-xs font-semibold text-purple-800 dark:text-purple-200 mb-2">JSON Format Example:</div>
                    <pre className="text-xs text-purple-700 dark:text-purple-300 bg-white dark:bg-gray-700 p-2 rounded overflow-x-auto">
{`{
  "name": "My Pinned Thing",
  "description": "A thing to pin to IPFS",
  "metadata": {
    "tags": ["example", "pinned"],
    "category": "test"
  }
}`}
                    </pre>
                  </div>
                  
                  <div className="space-y-3 flex-1">
                    <textarea
                      placeholder='Enter thing JSON to pin: {"name": "My Thing", "description": "A thing"}'
                      className="w-full px-3 py-2 border border-purple-200 dark:border-purple-600 rounded text-sm text-purple-900 dark:text-purple-100 bg-white dark:bg-gray-700"
                      rows={4}
                      onChange={(e) => setCreateDescription(e.target.value)}
                    />
                  </div>
                  
                  <button
                    onClick={async () => {
                      if (!createDescription.trim()) {
                        setError('Please enter thing data to pin')
                        return
                      }
                      if (!PINATA_CONFIG.apiToken) {
                        setError('Pinata API token not configured')
                        return
                      }
                      
                      setIsLoading(true)
                      setError(null)
                      
                      try {
                        let thing
                        try {
                          thing = JSON.parse(createDescription)
                        } catch (parseError) {
                          setError(`Invalid JSON format. Please check your syntax. Example: {"name": "My Thing", "description": "A thing"}`)
                          setIsLoading(false)
                          return
                        }
                        
                        // Validate required fields
                        if (!thing.name && !thing.description) {
                          setError('JSON must contain at least a "name" or "description" field')
                          setIsLoading(false)
                          return
                        }
                        
                        // SDK: Pin thing to IPFS
                        const result = await pinThing(PINATA_CONFIG.apiToken, thing)
                        
                        const newResult = {
                          name: 'Pinned Thing',
                          description: `Pinned to IPFS: ${result.IpfsHash}`,
                          ipfsHash: result.IpfsHash,
                          thing: thing,
                          createdAt: new Date().toISOString(),
                          type: 'pinned-thing'
                        }
                        
                        setResults(prev => [newResult, ...prev])
                        setCreateDescription('')
                      } catch (err) {
                        setError(`Failed to pin thing: ${err instanceof Error ? err.message : 'Unknown error'}`)
                      } finally {
                        setIsLoading(false)
                      }
                    }}
                    disabled={isLoading || !createDescription.trim()}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm mt-auto"
                  >
                    {isLoading ? 'Pinning...' : 'Pin Thing to IPFS'}
                  </button>
                </div>

                {/* Upload JSON to Pinata */}
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-4 flex flex-col h-full">
                  <h4 className="text-lg font-semibold text-orange-900 dark:text-orange-100 mb-3">Upload JSON to Pinata</h4>
                  <div className="text-xs text-orange-600 dark:text-orange-400 mb-3">
                    SDK: <code>uploadJsonToPinata</code> - Uploads JSON data to IPFS via Pinata.
                  </div>
                  
                  <div className="mb-3 p-3 bg-orange-100 dark:bg-orange-800 rounded border border-orange-200 dark:border-orange-600">
                    <div className="text-xs font-semibold text-orange-800 dark:text-orange-200 mb-2">JSON Format Examples:</div>
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs font-medium text-orange-700 dark:text-orange-300 mb-1">Simple Object:</div>
                        <pre className="text-xs text-orange-700 dark:text-orange-300 bg-white dark:bg-gray-700 p-2 rounded overflow-x-auto">
{`{
  "name": "My Data",
  "value": 123,
  "active": true
}`}
                        </pre>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-orange-700 dark:text-orange-300 mb-1">Complex Object:</div>
                        <pre className="text-xs text-orange-700 dark:text-orange-300 bg-white dark:bg-gray-700 p-2 rounded overflow-x-auto">
{`{
  "title": "My Document",
  "content": "This is the content",
  "metadata": {
    "author": "John Doe",
    "created": "2024-01-01",
    "tags": ["important", "document"]
  }
}`}
                        </pre>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3 flex-1">
                    <textarea
                      placeholder='Enter JSON data: {"name": "My Data", "value": 123}'
                      className="w-full px-3 py-2 border border-orange-200 dark:border-orange-600 rounded text-sm text-orange-900 dark:text-orange-100 bg-white dark:bg-gray-700"
                      rows={4}
                      onChange={(e) => setCreateDescription(e.target.value)}
                    />
                  </div>
                  
                  <button
                    onClick={async () => {
                      if (!createDescription.trim()) {
                        setError('Please enter JSON data')
                        return
                      }
                      if (!PINATA_CONFIG.apiToken) {
                        setError('Pinata API token not configured')
                        return
                      }
                      
                      setIsLoading(true)
                      setError(null)
                      
                      try {
                        let data
                        try {
                          data = JSON.parse(createDescription)
                        } catch (parseError) {
                          setError(`Invalid JSON format. Please check your syntax. Example: {"name": "My Data", "value": 123}`)
                          setIsLoading(false)
                          return
                        }
                        
                        // Validate that it's an object
                        if (typeof data !== 'object' || data === null || Array.isArray(data)) {
                          setError('JSON must be an object (not an array or primitive value)')
                          setIsLoading(false)
                          return
                        }
                        
                        // SDK: Upload JSON to Pinata
                        const result = await uploadJsonToPinata(PINATA_CONFIG.apiToken, data)
                        
                        const newResult = {
                          name: 'Uploaded JSON',
                          description: `Uploaded to IPFS: ${result.IpfsHash}`,
                          ipfsHash: result.IpfsHash,
                          data: data,
                          createdAt: new Date().toISOString(),
                          type: 'uploaded-json'
                        }
                        
                        setResults(prev => [newResult, ...prev])
                        setCreateDescription('')
                      } catch (err) {
                        setError(`Failed to upload JSON: ${err instanceof Error ? err.message : 'Unknown error'}`)
                      } finally {
                        setIsLoading(false)
                      }
                    }}
                    disabled={isLoading || !createDescription.trim()}
                    className="w-full px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm mt-auto"
                  >
                    {isLoading ? 'Uploading...' : 'Upload JSON to Pinata'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 
