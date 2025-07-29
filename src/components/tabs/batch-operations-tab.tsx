'use client'

import { useState } from 'react'
import { useIntuition } from '@/hooks/use-intuition'
import { useAccount, useChainId } from 'wagmi'
import { 
  getEthMultiVaultAddressFromChainId
} from '@0xintuition/sdk'
import { SUPPORTED_NETWORKS } from '@/lib/intuition-config'
import { usePublicClient, useWalletClient } from 'wagmi'

export function BatchOperationsTab() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<any[]>([])
  const [transactionHash, setTransactionHash] = useState<string | null>(null)

  const [ethereumAddresses, setEthereumAddresses] = useState('')
  const [smartContractAddresses, setSmartContractAddresses] = useState('')
  const [thingsData, setThingsData] = useState('')
  const [ipfsUris, setIpfsUris] = useState('')

  const {
    batchCreateAtomsFromEthereumAccounts,
    batchCreateAtomsFromSmartContracts,
    batchCreateAtomsFromThings,
    batchCreateAtomsFromIpfsUris
  } = useIntuition()
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  const getIntuitionConfig = (chainId: number) => {
    return SUPPORTED_NETWORKS.find(network => network.chainId === chainId)
  }

  const isSupportedNetwork = (chainId: number) => {
    return SUPPORTED_NETWORKS.some(network => network.chainId === chainId)
  }

  const handleBatchCreateFromEthereumAccounts = async () => {
    if (!ethereumAddresses.trim()) {
      setError('Please enter Ethereum addresses')
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
      const addresses = ethereumAddresses.split(',').map(addr => addr.trim()).filter(addr => addr)
      
      const ethMultiVaultAddress = getEthMultiVaultAddressFromChainId(chainId)
      
      // SDK: Batch create atoms from Ethereum accounts
      const result = await batchCreateAtomsFromEthereumAccounts(
        {
          walletClient,
          publicClient,
          address: ethMultiVaultAddress
        },
        addresses as `0x${string}`[]
      )
      
      const newAtoms = result.state?.map((atom, index) => ({
        name: `Ethereum Account Atom ${index + 1}`,
        description: `Created from address: ${addresses[index]}`,
        id: atom.vaultId?.toString() || `atom-${Date.now()}-${index}`,
        vaultId: atom.vaultId?.toString(),
        address: addresses[index],
        createdAt: new Date().toISOString(),
        type: 'ethereum-account',
        transactionHash: result.transactionHash
      })) || []
      
      setResults(prev => [...newAtoms, ...prev])
      setTransactionHash(result.transactionHash)
      setEthereumAddresses('')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      
      // Handle specific atom exists error for batch operations
      if (errorMessage.includes('EthMultiVault_AtomExists')) {
        const match = errorMessage.match(/\(([^,]+),\s*(\d+)\)/)
        if (match) {
          const atomUri = match[1]
          const atomId = match[2]
          setError(`Batch operation failed: One or more Ethereum addresses already have atoms. The first conflicting address has atom ID ${atomId}. You can search for atom ID ${atomId} in the Atoms tab to view the existing atom. Try creating atoms individually or use different addresses.`)
        } else {
          setError(`Batch operation failed: One or more Ethereum addresses already have atoms. Try creating atoms individually or use different addresses.`)
        }
      } else if (errorMessage.includes('Invalid address')) {
        setError('Invalid Ethereum address format in batch. Please ensure all addresses are valid 0x-prefixed addresses.')
      } else if (errorMessage.includes('insufficient funds')) {
        setError('Insufficient funds for batch transaction. Please ensure you have enough ETH for gas fees.')
      } else {
        setError(`Failed to batch create atoms from Ethereum accounts: ${errorMessage}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleBatchCreateFromSmartContracts = async () => {
    if (!smartContractAddresses.trim()) {
      setError('Please enter smart contract addresses')
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
      const addresses = smartContractAddresses.split(',').map(addr => addr.trim()).filter(addr => addr)
      
      const ethMultiVaultAddress = getEthMultiVaultAddressFromChainId(chainId)
      
      // SDK: Batch create atoms from smart contracts
      const result = await batchCreateAtomsFromSmartContracts(
        {
          walletClient,
          publicClient,
          address: ethMultiVaultAddress
        },
        addresses as `0x${string}`[]
      )
      
      const newAtoms = result.state?.map((atom, index) => ({
        name: `Smart Contract Atom ${index + 1}`,
        description: `Created from contract: ${addresses[index]}`,
        id: atom.vaultId?.toString() || `contract-${Date.now()}-${index}`,
        vaultId: atom.vaultId?.toString(),
        contractAddress: addresses[index],
        createdAt: new Date().toISOString(),
        type: 'smart-contract',
        transactionHash: result.transactionHash
      })) || []
      
      setResults(prev => [...newAtoms, ...prev])
      setTransactionHash(result.transactionHash)
      setSmartContractAddresses('')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      
      if (errorMessage.includes('Invalid address')) {
        setError('Invalid smart contract address format in batch. Please ensure all addresses are valid 0x-prefixed addresses.')
      } else if (errorMessage.includes('insufficient funds')) {
        setError('Insufficient funds for batch transaction. Please ensure you have enough ETH for gas fees.')
      } else {
        setError(`Failed to batch create atoms from smart contracts: ${errorMessage}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleBatchCreateFromThings = async () => {
    if (!thingsData.trim()) {
      setError('Please enter things data')
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
      let things
      try {
        things = JSON.parse(thingsData)
      } catch {
        setError('Invalid JSON format for things data')
        setIsLoading(false)
        return
      }
      
      const ethMultiVaultAddress = getEthMultiVaultAddressFromChainId(chainId)
      
      // SDK: Batch create atoms from things
      const result = await batchCreateAtomsFromThings(
        {
          walletClient,
          publicClient,
          address: ethMultiVaultAddress
        },
        things
      )
      
      const newAtoms = result.state?.map((atom, index) => ({
        name: `Thing Atom ${index + 1}`,
        description: `Created from thing: ${things[index]?.name || 'Unknown'}`,
        id: atom.vaultId?.toString() || `thing-${Date.now()}-${index}`,
        vaultId: atom.vaultId?.toString(),
        thing: things[index],
        createdAt: new Date().toISOString(),
        type: 'thing',
        transactionHash: result.transactionHash
      })) || []
      
      setResults(prev => [...newAtoms, ...prev])
      setTransactionHash(result.transactionHash)
      setThingsData('')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      
      if (errorMessage.includes('Invalid JSON')) {
        setError('Invalid JSON format in things data. Please ensure the JSON array is properly formatted.')
      } else if (errorMessage.includes('insufficient funds')) {
        setError('Insufficient funds for batch transaction. Please ensure you have enough ETH for gas fees.')
      } else {
        setError(`Failed to batch create atoms from things: ${errorMessage}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleBatchCreateFromIpfsUris = async () => {
    if (!ipfsUris.trim()) {
      setError('Please enter IPFS URIs')
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
      const uris = ipfsUris.split(',').map(uri => uri.trim()).filter(uri => uri)
      
      const ethMultiVaultAddress = getEthMultiVaultAddressFromChainId(chainId)
      
      // SDK: Batch create atoms from IPFS URIs
      const result = await batchCreateAtomsFromIpfsUris(
        {
          walletClient,
          publicClient,
          address: ethMultiVaultAddress
        },
        uris as `ipfs://${string}`[]
      )
      
      const newAtoms = result.state?.map((atom, index) => ({
        name: `IPFS Atom ${index + 1}`,
        description: `Created from IPFS URI: ${uris[index]}`,
        id: atom.vaultId?.toString() || `ipfs-${Date.now()}-${index}`,
        vaultId: atom.vaultId?.toString(),
        ipfsUri: uris[index],
        createdAt: new Date().toISOString(),
        type: 'ipfs-uri',
        transactionHash: result.transactionHash
      })) || []
      
      setResults(prev => [...newAtoms, ...prev])
      setTransactionHash(result.transactionHash)
      setIpfsUris('')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      
      if (errorMessage.includes('Invalid URI')) {
        setError('Invalid IPFS URI format in batch. Please ensure all URIs are valid IPFS URIs (ipfs://...).')
      } else if (errorMessage.includes('insufficient funds')) {
        setError('Insufficient funds for batch transaction. Please ensure you have enough ETH for gas fees.')
      } else {
        setError(`Failed to batch create atoms from IPFS URIs: ${errorMessage}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Batch Operations</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Create multiple atoms in a single transaction for efficient bulk operations. The SDK provides batch functions that optimize gas costs and transaction efficiency.
        </p>
        {!isConnected ? (
          <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3">
            <p className="text-yellow-700 dark:text-yellow-300 text-sm">Please connect your wallet to use batch operations</p>
          </div>
        ) : !isSupportedNetwork(chainId) ? (
          <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3">
            <p className="text-red-700 dark:text-red-300 text-sm">❌ Please switch to a supported network</p>
          </div>
        ) : (
          <div className="mt-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3">
            <p className="text-green-700 dark:text-green-300 text-sm">Connected to {getIntuitionConfig(chainId)?.name} - Ready for batch operations!</p>
          </div>
        )}
        
        {transactionHash && (
          <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
            <p className="text-blue-700 dark:text-blue-300 text-sm">
              Batch transaction successful! Hash: {transactionHash}
            </p>
          </div>
        )}
        
        {error && (
          <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3">
            <p className="text-red-700 dark:text-red-300 text-sm">❌ {error}</p>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* How It Works - FULL WIDTH ROW */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">How Batch Operations Work</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-blue-800 dark:text-blue-200">
            <div>
              <h4 className="font-semibold mb-2">What is Batching?</h4>
              <p className="mb-2">Batch operations allow you to create multiple atoms in a single blockchain transaction, significantly reducing gas costs and improving efficiency.</p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">SDK Implementation</h4>
              <p className="mb-2">The SDK provides specialized batch functions that handle the complex logic of creating multiple atoms atomically, ensuring all atoms are created successfully or none are created.</p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Benefits</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Reduced gas costs (single transaction vs multiple)</li>
                <li>Atomic operations (all-or-nothing)</li>
                <li>Better user experience (faster execution)</li>
                <li>Optimized for bulk data operations</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Use Cases</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Bulk importing data from external sources</li>
                <li>Creating multiple related atoms simultaneously</li>
                <li>Efficient onboarding of large datasets</li>
                <li>Batch processing of user-generated content</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Batch Atom Creation - GRID LAYOUT */}
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-4">Batch Atom Creation</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Batch Ethereum Accounts */}
            <div className="space-y-3">
              <label className="block text-lg font-semibold text-purple-700 dark:text-purple-300">
                Batch Create from Ethereum Accounts
              </label>
              <div className="text-xs text-purple-600 dark:text-purple-400 mb-2">
                SDK: <code>batchCreateAtomsFromEthereumAccounts</code> - Creates atoms representing Ethereum accounts in a single transaction.
              </div>
              <textarea
                placeholder="Enter Ethereum addresses (comma-separated): 0x123..., 0x456..."
                value={ethereumAddresses}
                onChange={(e) => setEthereumAddresses(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-purple-200 dark:border-purple-600 rounded text-sm text-purple-900 dark:text-purple-100 bg-white dark:bg-gray-700"
              />
              <button
                onClick={handleBatchCreateFromEthereumAccounts}
                disabled={isLoading || !ethereumAddresses.trim()}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isLoading ? 'Creating...' : 'Batch Create from ETH Accounts'}
              </button>
            </div>

            {/* Batch Smart Contracts */}
            <div className="space-y-3">
              <label className="block text-lg font-semibold text-purple-700 dark:text-purple-300">
                Batch Create from Smart Contracts
              </label>
              <div className="text-xs text-purple-600 dark:text-purple-400 mb-2">
                SDK: <code>batchCreateAtomsFromSmartContracts</code> - Creates atoms representing smart contracts in a single transaction.
              </div>
              <textarea
                placeholder="Enter smart contract addresses (comma-separated): 0x123..., 0x456..."
                value={smartContractAddresses}
                onChange={(e) => setSmartContractAddresses(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-purple-200 dark:border-purple-600 rounded text-sm text-purple-900 dark:text-purple-100 bg-white dark:bg-gray-700"
              />
              <button
                onClick={handleBatchCreateFromSmartContracts}
                disabled={isLoading || !smartContractAddresses.trim()}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isLoading ? 'Creating...' : 'Batch Create from Smart Contracts'}
              </button>
            </div>

            {/* Batch Things */}
            <div className="space-y-3">
              <label className="block text-lg font-semibold text-purple-700 dark:text-purple-300">
                Batch Create from Things
              </label>
              <div className="text-xs text-purple-600 dark:text-purple-400 mb-2">
                SDK: <code>batchCreateAtomsFromThings</code> - Creates atoms from "things" (entities) in a single transaction.
              </div>
              <textarea
                placeholder='Enter JSON array of things: [{"name": "Thing 1"}, {"name": "Thing 2"}]'
                value={thingsData}
                onChange={(e) => setThingsData(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-purple-200 dark:border-purple-600 rounded text-sm text-purple-900 dark:text-purple-100 bg-white dark:bg-gray-700"
              />
              <button
                onClick={handleBatchCreateFromThings}
                disabled={isLoading || !thingsData.trim()}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isLoading ? 'Creating...' : 'Batch Create from Things'}
              </button>
            </div>

            {/* Batch IPFS URIs */}
            <div className="space-y-3">
              <label className="block text-lg font-semibold text-purple-700 dark:text-purple-300">
                Batch Create from IPFS URIs
              </label>
              <div className="text-xs text-purple-600 dark:text-purple-400 mb-2">
                SDK: <code>batchCreateAtomsFromIpfsUris</code> - Creates atoms from IPFS URIs in a single transaction.
              </div>
              <textarea
                placeholder="Enter IPFS URIs (comma-separated): ipfs://Qm..., ipfs://Qm..."
                value={ipfsUris}
                onChange={(e) => setIpfsUris(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-purple-200 dark:border-purple-600 rounded text-sm text-purple-900 dark:text-purple-100 bg-white dark:bg-gray-700"
              />
              <button
                onClick={handleBatchCreateFromIpfsUris}
                disabled={isLoading || !ipfsUris.trim()}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isLoading ? 'Creating...' : 'Batch Create from IPFS URIs'}
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Batch Results</h3>
            <div className="space-y-3">
              {results.map((result, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm">{result.name}</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{result.description}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        Type: {result.type} | ID: {result.id}
                      </p>
                      {result.transactionHash && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          TX: {result.transactionHash}
                        </p>
                      )}
                      {result.ipfsUri && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                          IPFS: {result.ipfsUri}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(result.createdAt).toLocaleTimeString()}
                    </span>
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