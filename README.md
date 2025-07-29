# Intuition SDK Showcase

A comprehensive demonstration of the Intuition SDK capabilities for creating atoms, triples, and exploring real-world use cases. This project showcases all major SDK functions with a modern, user-friendly interface.

## Features

- **Atom Creation**: Multiple methods for creating atoms (string, IPFS, Ethereum accounts, things)
- **Triple Creation**: Create subject-predicate-object relationships between atoms
- **Batch Operations**: Efficient bulk creation of atoms and triples
- **Vault Lookup**: Search and view atom/triple vaults and trading data
- **Use Cases**: Real-world examples and applications
- **IPFS Integration**: Pinata integration for decentralized file storage
- **Multi-Network Support**: Works on Ethereum, Arbitrum, Base (mainnet and testnets)

## Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- MetaMask or other Web3 wallet
- Testnet ETH for transactions

## Quick Start

### 1. Fork and Clone

```bash
# Fork this repository on GitHub
# Then clone your fork
git clone https://github.com/YOUR_USERNAME/intuition_speedrun.git
cd intuition_speedrun
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory:

```bash
# Required: WalletConnect Project ID
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id

# Optional: Pinata API Token (for IPFS uploads)
NEXT_PUBLIC_PINATA_API_TOKEN=your_pinata_jwt_token
```

#### Getting Environment Variables

**WalletConnect Project ID:**
1. Go to [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Create a new project
3. Copy the Project ID
4. Add to `.env.local` as `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`

**Pinata API Token (Optional):**
1. Go to [Pinata](https://app.pinata.cloud/)
2. Create an account and verify email
3. Go to API Keys section
4. Create a new API key with the following scopes:
   - `pinFileToIPFS`
   - `pinJSONToIPFS`
5. Copy the JWT token
6. Add to `.env.local` as `NEXT_PUBLIC_PINATA_API_TOKEN`

### 4. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## SDK Usage Examples

### Atom Creation

#### Basic Atom Creation
```typescript
import { createAtomFromString } from '@0xintuition/sdk'

const result = await createAtomFromString(
  {
    walletClient,
    publicClient,
    address: ethMultiVaultAddress
  },
  'My Atom Name',
  'My atom description'
)
```

#### Create Atom from Ethereum Account
```typescript
import { createAtomFromEthereumAccount } from '@0xintuition/sdk'

const result = await createAtomFromEthereumAccount(
  {
    walletClient,
    publicClient,
    address: ethMultiVaultAddress
  },
  '0x1234567890123456789012345678901234567890'
)
```

#### Create Atom from IPFS URI
```typescript
import { createAtomFromIpfsUri } from '@0xintuition/sdk'

const result = await createAtomFromIpfsUri(
  {
    walletClient,
    publicClient,
    address: ethMultiVaultAddress
  },
  'ipfs://QmYourContentHash'
)
```

#### Create Atom from Thing (JSON)
```typescript
import { createAtomFromThing } from '@0xintuition/sdk'

const thing = {
  name: 'My Thing',
  description: 'A thing description',
  properties: {
    type: 'example',
    value: 123
  }
}

const result = await createAtomFromThing(
  {
    walletClient,
    publicClient,
    address: ethMultiVaultAddress
  },
  thing
)
```

### Batch Atom Creation

#### Batch Create from Ethereum Accounts
```typescript
import { batchCreateAtomsFromEthereumAccounts } from '@0xintuition/sdk'

const addresses = [
  '0x1234567890123456789012345678901234567890',
  '0x0987654321098765432109876543210987654321'
] as `0x${string}`[]

const result = await batchCreateAtomsFromEthereumAccounts(
  {
    walletClient,
    publicClient,
    address: ethMultiVaultAddress
  },
  addresses
)
```

#### Batch Create from Smart Contracts
```typescript
import { batchCreateAtomsFromSmartContracts } from '@0xintuition/sdk'

const contractAddresses = [
  '0x1234567890123456789012345678901234567890',
  '0x0987654321098765432109876543210987654321'
] as `0x${string}`[]

const result = await batchCreateAtomsFromSmartContracts(
  {
    walletClient,
    publicClient,
    address: ethMultiVaultAddress
  },
  contractAddresses
)
```

#### Batch Create from Things
```typescript
import { batchCreateAtomsFromThings } from '@0xintuition/sdk'

const things = [
  { name: 'Thing 1', description: 'First thing' },
  { name: 'Thing 2', description: 'Second thing' }
]

const result = await batchCreateAtomsFromThings(
  {
    walletClient,
    publicClient,
    address: ethMultiVaultAddress
  },
  things
)
```

#### Batch Create from IPFS URIs
```typescript
import { batchCreateAtomsFromIpfsUris } from '@0xintuition/sdk'

const ipfsUris = [
  'ipfs://QmYourFirstContentHash',
  'ipfs://QmYourSecondContentHash'
]

const result = await batchCreateAtomsFromIpfsUris(
  {
    walletClient,
    publicClient,
    address: ethMultiVaultAddress
  },
  ipfsUris
)
```

### Triple Creation

#### Create Triple with New Atoms
```typescript
import { batchCreateTripleStatements } from '@0xintuition/sdk'

const tripleStatements = [
  {
    subject: { name: 'Subject Atom', description: 'Subject description' },
    predicate: { name: 'Predicate Atom', description: 'Predicate description' },
    object: { name: 'Object Atom', description: 'Object description' }
  }
]

const result = await batchCreateTripleStatements(
  {
    walletClient,
    publicClient,
    address: ethMultiVaultAddress
  },
  tripleStatements
)
```

### IPFS Integration

#### Upload JSON to Pinata
```typescript
import { uploadJsonToPinata } from '@0xintuition/sdk'

const jsonData = {
  name: 'My JSON Data',
  description: 'Data to upload to IPFS',
  timestamp: Date.now()
}

const result = await uploadJsonToPinata(
  PINATA_CONFIG.apiToken,
  jsonData
)
```

#### Pin Thing to IPFS
```typescript
import { pinThing } from '@0xintuition/sdk'

const thing = {
  name: 'My Thing',
  description: 'A thing to pin to IPFS',
  properties: { type: 'example' }
}

const result = await pinThing(
  PINATA_CONFIG.apiToken,
  thing
)
```

### Atom and Triple Retrieval

#### Get Atom by ID
```typescript
import { getAtom } from '@0xintuition/sdk'

const atom = await getAtom(
  {
    publicClient,
    address: ethMultiVaultAddress
  },
  BigInt(atomId)
)
```

#### Get Triple by ID
```typescript
import { getTriple } from '@0xintuition/sdk'

const triple = await getTriple(
  {
    publicClient,
    address: ethMultiVaultAddress
  },
  BigInt(tripleId)
)
```

## Project Structure

```
src/
├── app/                    # Next.js app directory
├── components/             # React components
│   ├── tabs/              # Tab components for different features
│   │   ├── atom-tab.tsx   # Atom creation and search
│   │   ├── triple-tab.tsx # Triple creation and vault lookup
│   │   ├── batch-operations-tab.tsx # Batch operations
│   │   └── use-cases-tab.tsx # Real-world use cases
│   ├── intuition-showcase.tsx # Main showcase component
│   ├── navbar.tsx         # Navigation bar
│   ├── wallet-connect.tsx # Wallet connection
│   └── theme-toggle.tsx   # Dark/light theme toggle
├── hooks/                 # Custom React hooks
│   └── use-intuition.ts  # Intuition SDK hook
├── lib/                   # Utility libraries
│   └── intuition-config.ts # Network configuration
└── providers/             # React providers
    ├── rainbowkit-provider.tsx # RainbowKit setup
    └── theme-provider.tsx # Theme provider
```

## Supported Networks

### Mainnet Networks
- **Ethereum Mainnet** (Chain ID: 1)
- **Arbitrum One** (Chain ID: 42161)
- **Base** (Chain ID: 8453)

### Testnet Networks
- **Sepolia Testnet** (Chain ID: 11155111)
- **Arbitrum Sepolia** (Chain ID: 421614)
- **Base Sepolia** (Chain ID: 84532)

## Error Handling

The application includes comprehensive error handling for common scenarios:

### Atom Already Exists
When an atom already exists for an Ethereum address, the error message includes the existing atom ID:

```
Atom already exists! This Ethereum address (0x1234...) already has an atom with ID 26756. 
You can search for atom ID 26756 in the Search Atoms section to view the existing atom.
```

### Batch Operation Failures
Batch operations fail if any address already has an atom. The error message shows the conflicting atom ID and provides guidance.

### Network-Specific Errors
- Invalid network selection
- Insufficient funds
- Invalid address format
- JSON parsing errors

## Development

### Available Scripts

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linting
pnpm lint
```

### Adding New SDK Features

1. Import the new SDK function in `src/hooks/use-intuition.ts`
2. Add it to the returned object structure
3. Create UI components in the appropriate tab
4. Add error handling and loading states
5. Test on supported networks

### Customization

#### Adding New Networks
Edit `src/lib/intuition-config.ts` to add new networks:

```typescript
export const INTUITION_SUPPORTED_NETWORKS: IntuitionConfig[] = [
  // ... existing networks
  {
    chainId: YOUR_CHAIN_ID,
    name: 'Your Network Name',
    rpcUrl: 'https://your-rpc-url',
    blockExplorer: 'https://your-explorer-url',
    testnet: true // or false
  }
]
```

#### Modifying Default Configuration
Update `DEFAULT_ATOM_CONFIG` in `src/lib/intuition-config.ts`:

```typescript
export const DEFAULT_ATOM_CONFIG = {
  depositAmount: BigInt(0.001 * 10**18), // 0.001 ETH
  protocolFee: BigInt(0.0001 * 10**18),  // 0.0001 ETH
  minDeposit: BigInt(0.0001 * 10**18),   // 0.0001 ETH
}
```

## Troubleshooting

### Common Issues

**Wallet Connection Issues:**
- Ensure WalletConnect Project ID is correctly set
- Check that your wallet supports the selected network
- Try refreshing the page and reconnecting

**Transaction Failures:**
- Ensure you have sufficient ETH for gas fees
- Check that you're on a supported network
- Verify the address format is correct (0x-prefixed)

**IPFS Upload Issues:**
- Verify Pinata API token is valid and has correct scopes
- Check that JSON data is properly formatted
- Ensure network connectivity to Pinata

**Batch Operation Failures:**
- Check that all addresses are valid and unique
- Ensure no addresses already have atoms
- Verify sufficient funds for the entire batch

### Getting Help

1. Check the browser console for detailed error messages
2. Verify your environment variables are correctly set
3. Ensure you're on a supported network
4. Check that your wallet has sufficient funds

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly on multiple networks
5. Submit a pull request

## License

This project is open source and available under the MIT License.
