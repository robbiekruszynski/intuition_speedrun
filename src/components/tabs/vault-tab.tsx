'use client'

import { useState } from 'react'
import { useIntuition } from '@/hooks/use-intuition'
import { useAccount, useChainId } from 'wagmi'
import { 
  batchCreateAtomsFromEthereumAccounts,
  batchCreateAtomsFromSmartContracts,
  batchCreateAtomsFromThings,
  batchCreateAtomsFromIpfsUris,
  createAtomFromEthereumAccount,
  createAtomFromThing,
  pinThing,
  uploadJsonToPinata,
  getEthMultiVaultAddressFromChainId
} from '@0xintuition/sdk'
import { 
  getIntuitionConfig, 
  isSupportedNetwork,
  PINATA_CONFIG
} from '@/lib/intuition-config'
import { usePublicClient, useWalletClient } from 'wagmi'

export function AdvancedTab() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<any[]>([])
  const [transactionHash, setTransactionHash] = useState<string | null>(null)

  const [ethereumAddresses, setEthereumAddresses] = useState('')
  const [smartContractAddresses, setSmartContractAddresses] = useState('')
  const [thingsData, setThingsData] = useState('')
  const [ipfsUris, setIpfsUris] = useState('')
  
  const [singleEthereumAddress, setSingleEthereumAddress] = useState('')
  const [thingData, setThingData] = useState('')
  const [jsonData, setJsonData] = useState('')

  const { intuition } = useIntuition()
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

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
      setError(`Failed to batch create atoms from Ethereum accounts: ${err instanceof Error ? err.message : 'Unknown error'}`)
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
      setError(`Failed to batch create atoms from smart contracts: ${err instanceof Error ? err.message : 'Unknown error'}`)
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
      setError(`Failed to batch create atoms from things: ${err instanceof Error ? err.message : 'Unknown error'}`)
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
      setError(`Failed to batch create atoms from IPFS URIs: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateFromEthereumAccount = async () => {
    if (!singleEthereumAddress.trim()) {
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
        singleEthereumAddress as `0x${string}`
      )
      
      const newAtom = {
        name: 'Ethereum Account Atom',
        description: `Created from address: ${singleEthereumAddress}`,
        id: result.state?.vaultId?.toString() || `eth-${Date.now()}`,
        vaultId: result.state?.vaultId?.toString(),
        address: singleEthereumAddress,
        createdAt: new Date().toISOString(),
        type: 'ethereum-account',
        transactionHash: result.transactionHash
      }
      
      setResults(prev => [newAtom, ...prev])
      setTransactionHash(result.transactionHash)
      setSingleEthereumAddress('')
    } catch (err) {
      setError(`Failed to create atom from Ethereum account: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateFromThing = async () => {
    if (!thingData.trim()) {
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
        thing = JSON.parse(thingData)
      } catch {
        setError('Invalid JSON format for thing data')
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
      setThingData('')
    } catch (err) {
      setError(`Failed to create atom from thing: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePinThing = async () => {
    if (!thingData.trim()) {
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
        thing = JSON.parse(thingData)
      } catch {
        setError('Invalid JSON format for thing data')
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
      setThingData('')
    } catch (err) {
      setError(`Failed to pin thing: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUploadJsonToPinata = async () => {
    if (!jsonData.trim()) {
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
        data = JSON.parse(jsonData)
      } catch {
        setError('Invalid JSON format')
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
      setJsonData('')
    } catch (err) {
      setError(`Failed to upload JSON: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Advanced SDK Features</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Showcase advanced Intuition SDK capabilities including batch operations, advanced atom creation, and IPFS integration.
        </p>
        {!isConnected ? (
          <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3">
            <p className="text-yellow-700 dark:text-yellow-300 text-sm">Please connect your wallet to use advanced features</p>
          </div>
        ) : !isSupportedNetwork(chainId) ? (
          <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3">
            <p className="text-red-700 dark:text-red-300 text-sm">❌ Please switch to a supported network</p>
          </div>
        ) : (
          <div className="mt-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3">
            <p className="text-green-700 dark:text-green-300 text-sm">Connected to {getIntuitionConfig(chainId)?.name} - Ready for advanced features!</p>
          </div>
        )}
        
        {transactionHash && (
          <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
            <p className="text-blue-700 dark:text-blue-300 text-sm">
              Transaction successful! Hash: {transactionHash}
            </p>
          </div>
        )}
        
        {error && (
          <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3">
            <p className="text-red-700 dark:text-red-300 text-sm">❌ {error}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Batch Operations */}
        <div className="space-y-6">
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-4">Batch Operations</h3>
            
            {/* Batch Ethereum Accounts */}
            <div className="space-y-3 mb-4">
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300">
                Batch Create from Ethereum Accounts
              </label>
              <textarea
                placeholder="Enter Ethereum addresses (comma-separated): 0x123..., 0x456..."
                value={ethereumAddresses}
                onChange={(e) => setEthereumAddresses(e.target.value)}
                rows={2}
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
            <div className="space-y-3 mb-4">
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300">
                Batch Create from Smart Contracts
              </label>
              <textarea
                placeholder="Enter smart contract addresses (comma-separated): 0x123..., 0x456..."
                value={smartContractAddresses}
                onChange={(e) => setSmartContractAddresses(e.target.value)}
                rows={2}
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
            <div className="space-y-3 mb-4">
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300">
                Batch Create from Things
              </label>
              <textarea
                placeholder="Enter JSON array of things (e.g., [{name: 'Thing 1', description: 'Description 1'}, {name: 'Thing 2', description: 'Description 2'}])"
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
            <div className="space-y-3 mb-4">
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300">
                Batch Create from IPFS URIs
              </label>
              <textarea
                placeholder="Enter IPFS URIs (comma-separated): ipfs://Qm... or ipfs://ipfs://Qm..."
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

        {/* Advanced Atom Creation */}
        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">Advanced Atom Creation</h3>
            
            {/* Create from Ethereum Account */}
            <div className="space-y-3 mb-4">
              <label className="block text-sm font-medium text-blue-700 dark:text-blue-300">
                Create Atom from Ethereum Account
              </label>
              <input
                type="text"
                placeholder="Enter Ethereum address (e.g., 0x123...)"
                value={singleEthereumAddress}
                onChange={(e) => setSingleEthereumAddress(e.target.value)}
                className="w-full px-3 py-2 border border-blue-200 dark:border-blue-600 rounded text-sm text-blue-900 dark:text-blue-100 bg-white dark:bg-gray-700"
              />
              <button
                onClick={handleCreateFromEthereumAccount}
                disabled={isLoading || !singleEthereumAddress.trim()}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isLoading ? 'Creating...' : 'Create from ETH Account'}
              </button>
            </div>

            {/* Create from Thing */}
            <div className="space-y-3 mb-4">
              <label className="block text-sm font-medium text-blue-700 dark:text-blue-300">
                Create Atom from Thing
              </label>
              <textarea
                placeholder="Enter JSON object for a thing (e.g., {name: 'Thing 1', description: 'Description 1'})"
                value={thingData}
                onChange={(e) => setThingData(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-blue-200 dark:border-blue-600 rounded text-sm text-blue-900 dark:text-blue-100 bg-white dark:bg-gray-700"
              />
              <button
                onClick={handleCreateFromThing}
                disabled={isLoading || !thingData.trim()}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isLoading ? 'Creating...' : 'Create from Thing'}
              </button>
            </div>

            {/* Pin Thing to IPFS */}
            <div className="space-y-3 mb-4">
              <label className="block text-sm font-medium text-blue-700 dark:text-blue-300">
                Pin Thing to IPFS
              </label>
              <textarea
                placeholder="Enter JSON object for a thing to pin (e.g., {name: 'Thing 1', description: 'Description 1'})"
                value={thingData}
                onChange={(e) => setThingData(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-blue-200 dark:border-blue-600 rounded text-sm text-blue-900 dark:text-blue-100 bg-white dark:bg-gray-700"
              />
              <button
                onClick={handlePinThing}
                disabled={isLoading || !thingData.trim()}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isLoading ? 'Pinning...' : 'Pin Thing to IPFS'}
              </button>
              </div>

            {/* Upload JSON to Pinata */}
            <div className="space-y-3 mb-4">
              <label className="block text-sm font-medium text-blue-700 dark:text-blue-300">
                Upload JSON to Pinata
              </label>
              <textarea
                placeholder="Enter JSON data to upload (e.g., {key: 'value'})"
                value={jsonData}
                onChange={(e) => setJsonData(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-blue-200 dark:border-blue-600 rounded text-sm text-blue-900 dark:text-blue-100 bg-white dark:bg-gray-700"
              />
              <button
                onClick={handleUploadJsonToPinata}
                disabled={isLoading || !jsonData.trim()}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isLoading ? 'Uploading...' : 'Upload JSON to Pinata'}
              </button>
            </div>
          </div>
              </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Results</h3>
            <div className="space-y-3">
              {results.map((result, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start">
              <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{result.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{result.description}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        Type: {result.type} | ID: {result.id}
                      </p>
                      {result.transactionHash && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          TX: {result.transactionHash}
                        </p>
                      )}
                      {result.ipfsHash && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                          IPFS: {result.ipfsHash}
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