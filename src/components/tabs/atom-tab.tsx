'use client'

import { useState } from 'react'
import { useIntuition } from '@/hooks/use-intuition'
import { useAccount, useChainId } from 'wagmi'
import { 
  createAtomFromString, 
  createAtomFromIpfsUri, 
  createAtomFromIpfsUpload,
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
  const [createMethod, setCreateMethod] = useState<'basic' | 'ipfs'>('basic')
  const [ipfsContent, setIpfsContent] = useState('')
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
      console.log('Searching for atom with ID:', searchQuery)
      
      // This calls the Intuition SDK to fetch atom data
      const atom = await getAtom(searchQuery)
      console.log('SDK response:', atom)
      
      if (atom) {
        // Convert the SDK response to something our UI can display
        const transformedAtom = {
          name: atom.label || atom.data || 'Unnamed Atom',
          description: atom.data || atom.label || 'No description available',
          id: atom.term_id?.toString() || searchQuery,
          creator: atom.creator?.label || 'Unknown',
          createdAt: atom.created_at,
          type: atom.type,
          emoji: atom.emoji,
          image: atom.image,
          transactionHash: atom.transaction_hash,
          blockNumber: atom.block_number
        }
        
        console.log('Transformed atom:', transformedAtom)
        setResults([transformedAtom])
      } else {
        setError(`Atom ID ${searchQuery} not found.`)
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
      console.log('Creating basic atom:', { name: createName, description: createDescription })
      
      // Prepare the atom data for the SDK
      const atomData = JSON.stringify({
        name: createName,
        description: createDescription,
        type: 'basic',
        createdAt: new Date().toISOString()
      })
      
      // The SDK needs the right contract address for your current network
      const ethMultiVaultAddress = getEthMultiVaultAddressFromChainId(chainId)
      console.log('Contract address for chain', chainId, ':', ethMultiVaultAddress)
      console.log('Wallet client:', walletClient)
      console.log('Public client:', publicClient)
      
      // This is where the magic happens - the SDK creates your atom on-chain
      const result = await createAtomFromString(
        {
          walletClient,
          publicClient,
          address: ethMultiVaultAddress
        },
        atomData
      )
      
      console.log('Atom creation result:', result)
      console.log('Result state:', result.state)
      console.log('Result URI:', result.uri)
      console.log('Result transaction hash:', result.transactionHash)
      console.log('Full result object:', JSON.stringify(result, (key, value) => 
        typeof value === 'bigint' ? value.toString() : value, 2))
      
      // The SDK gives us a vault ID - this is what you'll use to find your atom later
      const atomId = result.state?.vaultId?.toString() || 
                    result.uri?.split('/').pop() || 
                    result.transactionHash?.slice(0, 8) ||
                    'Unknown'
      
      console.log('Extracted atom ID:', atomId)
      console.log('Vault ID type:', typeof result.state?.vaultId)
      console.log('Vault ID value:', result.state?.vaultId)
      
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
      console.error(err)
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
      console.log('Creating atom from IPFS URI:', ipfsContent)
      
      // The SDK needs the right contract address for your current network
      const ethMultiVaultAddress = getEthMultiVaultAddressFromChainId(chainId)
      
      // This creates an atom from an existing IPFS URI
      const result = await createAtomFromIpfsUri(
        {
          walletClient,
          publicClient,
          address: ethMultiVaultAddress
        },
        ipfsContent as `ipfs://${string}`
      )
      
      console.log('IPFS atom creation result:', result)
      console.log('Result state:', result.state)
      console.log('Result URI:', result.uri)
      
      // The SDK gives us a vault ID - this is what you'll use to find your atom later
      const atomId = result.state?.vaultId?.toString() || 
                    result.uri?.split('/').pop() || 
                    result.transactionHash?.slice(0, 8) ||
                    'Unknown'
      
      console.log('Extracted atom ID:', atomId)
      
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
      console.error(err)
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
      console.log('Uploading to IPFS and creating atom:', ipfsContent)
      
      // First we upload your data to IPFS using Pinata
      const jsonData = {
        name: `IPFS Upload Atom - ${Date.now()}`,
        description: ipfsContent,
        type: 'ipfs-upload',
        createdAt: new Date().toISOString()
      }
      
      const pinataResponse = await uploadJsonToPinata(PINATA_CONFIG.apiToken, jsonData)
      console.log('Pinata upload response:', pinataResponse)
      
      // Create the IPFS URI that points to your uploaded data
      const ipfsUri = `ipfs://${pinataResponse.IpfsHash}`
      
      // The SDK needs the right contract address for your current network
      const ethMultiVaultAddress = getEthMultiVaultAddressFromChainId(chainId)
      
      // Now the SDK creates an atom that references your IPFS data
      const result = await createAtomFromIpfsUpload(
        {
          walletClient,
          publicClient,
          address: ethMultiVaultAddress,
          pinataApiJWT: PINATA_CONFIG.apiToken
        },
        jsonData
      )
      
      console.log('IPFS upload atom creation result:', result)
      console.log('Result state:', result.state)
      console.log('Result URI:', result.uri)
      
      // The SDK gives us a vault ID - this is what you'll use to find your atom later
      const atomId = result.state?.vaultId?.toString() || 
                    result.uri?.split('/').pop() || 
                    result.transactionHash?.slice(0, 8) ||
                    'Unknown'
      
      console.log('Extracted atom ID:', atomId)
      
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
        <div className="mt-2 bg-orange-50 border border-orange-200 rounded-lg p-3">
          <p className="text-orange-700 text-sm">
            💡 <strong>Vault Information:</strong> Each atom automatically creates a vault that can be used for trading shares and monetizing knowledge. 
            Vault IDs are displayed in the results below.
          </p>
        </div>
                {!isConnected ? (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-yellow-700 text-sm">⚠️ Please connect your wallet to create atoms</p>
          </div>
        ) : !isSupportedNetwork(chainId) ? (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-700 text-sm">❌ Please switch to a supported network: Sepolia, Arbitrum Sepolia, or Base Sepolia</p>
          </div>
        ) : (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-green-700 text-sm">✅ Connected to {getIntuitionConfig(chainId)?.name} - Ready to create atoms!</p>
          </div>
        )}
        
        {/* Transaction Status */}
        {transactionHash && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-blue-700 text-sm">
              🎉 Transaction submitted! Hash: 
              <a 
                href={`${getIntuitionConfig(chainId)?.blockExplorer}/tx/${transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline ml-1"
              >
                {transactionHash.slice(0, 10)}...{transactionHash.slice(-8)}
              </a>
            </p>
            <p className="text-blue-600 text-xs mt-2">
              ⏱️ Your atom will be searchable in 1-5 minutes once it's indexed by the network.
            </p>
          </div>
        )}
      </div>
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Search Atoms</h3>
        <p className="text-sm text-gray-600 mb-4">
          Enter an atom ID to search for a specific atom in the Intuition network.
          <br />
          <span className="text-xs text-gray-500">
            Example: Try searching 1 and the results will populate below
            <br />
            <span className="text-orange-600 font-medium">Note: Newly created atoms may take 1-5 minutes to become searchable.</span>
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
        
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="mt-4">
            <h4 className="text-md font-semibold mb-3">Results</h4>
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <div className="space-y-4">
                    {/* Header with Atom ID prominently displayed */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h5 className="text-lg font-semibold text-gray-900">{result.name}</h5>
                          {result.type && (
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              result.type === 'basic' ? 'bg-green-100 text-green-700' :
                              result.type === 'ipfs-uri' ? 'bg-blue-100 text-blue-700' :
                              result.type === 'ipfs-upload' ? 'bg-purple-100 text-purple-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                            {result.type}
                          </span>
                          )}
                        </div>
                        <p className="text-gray-700 text-sm leading-relaxed">{result.description}</p>
                      </div>
                    </div>
                    {result.id && (
                      <div className="bg-gray-50 p-3 rounded-lg border">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Atom ID:</span>
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
                            title="Copy Atom ID"
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
                    {result.type && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        <span className="text-gray-900 capitalize">{result.type.replace('-', ' ')}</span>
                      </div>
                    )}
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

   
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Create New Atom</h3>
        <div className="mb-4">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {(['basic', 'ipfs'] as const).map((method) => (
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
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h4 className="text-sm font-semibold text-blue-800 mb-2">🌐 IPFS Atom Creation</h4>
              <p className="text-sm text-blue-700 leading-relaxed">
                Create atoms from IPFS content in two ways:
              </p>
              <ul className="text-xs text-blue-600 mt-2 space-y-1">
                <li>• <strong>From IPFS URI:</strong> Use existing content already uploaded to IPFS</li>
                <li>• <strong>Upload & Create:</strong> Upload new content to IPFS and create an atom</li>
              </ul>
              <p className="text-xs text-blue-600 mt-2">
                IPFS atoms can contain rich data like images, documents, or complex JSON structures.
              </p>
            </div>
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
