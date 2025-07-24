'use client'

import { useEffect, useState } from 'react'
import { 
  getAtom, 
  getTriple, 
  pinThing,
  batchCreateAtomsFromEthereumAccounts,
  batchCreateAtomsFromIpfsUris,
  batchCreateAtomsFromSmartContracts,
  batchCreateAtomsFromThings,
  batchCreateTripleStatements,
  createAtomFromEthereumAccount,
  createAtomFromIpfsUpload,
  createAtomFromIpfsUri,
  createAtomFromString,
  createAtomFromThing,
  uploadJsonToPinata
} from '@0xintuition/sdk'

export function useIntuition() {
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initializeIntuition = async () => {
      try {
        // The Intuition SDK exports individual functions, no initialization needed
        setIsInitialized(true)
        setError(null)
      } catch (err) {
        console.error('Failed to initialize Intuition SDK:', err)
        setError('Failed to initialize Intuition SDK')
      }
    }

    initializeIntuition()
  }, [])

  return {
    intuition: {
      atoms: {
        get: getAtom,
        create: {
          fromEthereumAccount: createAtomFromEthereumAccount,
          fromIpfsUpload: createAtomFromIpfsUpload,
          fromIpfsUri: createAtomFromIpfsUri,
          fromString: createAtomFromString,
          fromThing: createAtomFromThing,
          batchFromEthereumAccounts: batchCreateAtomsFromEthereumAccounts,
          batchFromIpfsUris: batchCreateAtomsFromIpfsUris,
          batchFromSmartContracts: batchCreateAtomsFromSmartContracts,
          batchFromThings: batchCreateAtomsFromThings,
        }
      },
      triples: {
        get: getTriple,
        create: {
          batch: batchCreateTripleStatements
        }
      },
      pinata: {
        uploadJson: uploadJsonToPinata
      },
      pinThing
    },
    isInitialized,
    error
  }
} 