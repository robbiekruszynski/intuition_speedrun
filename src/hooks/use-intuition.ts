'use client'

import {
  createAtomFromString,
  createAtomFromEthereumAccount,
  createAtomFromThing,
  pinThing,
  uploadJsonToPinata,
  batchCreateAtomsFromEthereumAccounts,
  batchCreateAtomsFromSmartContracts,
  batchCreateAtomsFromThings,
  batchCreateAtomsFromIpfsUris,
  batchCreateTripleStatements,
  getAtom,
  getTriple,
  getEthMultiVaultAddressFromChainId
} from '@0xintuition/sdk'

export function useIntuition() {
  return {
    createAtomFromString,
    createAtomFromEthereumAccount,
    createAtomFromThing,
    pinThing,
    uploadJsonToPinata,
    batchCreateAtomsFromEthereumAccounts,
    batchCreateAtomsFromSmartContracts,
    batchCreateAtomsFromThings,
    batchCreateAtomsFromIpfsUris,
    batchCreateTripleStatements,
    getAtom,
    getTriple,
    getEthMultiVaultAddressFromChainId
  }
} 