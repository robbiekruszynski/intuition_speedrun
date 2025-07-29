# Intuition SDK Showcase

A comprehensive demonstration of our SDK capabilities for creating atoms, triples, and exploring real-world use cases. This project showcases all major SDK functions with a modern, user-friendly interface.

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

### Fork/Clone the Repository

```bash
git clone https://github.com/your-username/intuition_speedrun.git
cd intuition_speedrun
```

### Install Dependencies

```bash
pnpm install
```

### Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
NEXT_PUBLIC_PINATA_API_TOKEN=your_pinata_api_token
```

**Getting Environment Variables:**

1. **WalletConnect Project ID**: 
   - Go to [WalletConnect Cloud](https://cloud.walletconnect.com/)
   - Create a new project
   - Copy the Project ID

2. **Pinata API Token**:
   - Go to [Pinata](https://pinata.cloud/)
   - Create an account and get your API token
   - Ensure it has the necessary scopes for IPFS uploads

### Run the Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## SDK Usage Examples

### Atom Creation

```typescript
import { createAtomFromString } from '@0xintuition/sdk'

const config = {
  walletClient,
  publicClient,
  ethMultiVaultAddress
}

const result = await createAtomFromString(config, 'Hello World')
console.log('Atom created:', result.state[0]?.vaultId)
```

### Batch Atom Creation

```typescript
import { batchCreateAtomsFromEthereumAccounts } from '@0xintuition/sdk'

const addresses = ['0x123...', '0x456...']
const result = await batchCreateAtomsFromEthereumAccounts(config, addresses)
```

### Triple Creation

```typescript
import { batchCreateTripleStatements } from '@0xintuition/sdk'

const triples = [
  {
    subject: 'Alice',
    predicate: 'knows',
    object: 'Bob'
  }
]

const result = await batchCreateTripleStatements(config, triples)
```

### IPFS Integration

```typescript
import { pinThing, uploadJsonToPinata } from '@0xintuition/sdk'

const thing = { name: 'Test', description: 'A test thing' }
const pinned = await pinThing(thing)

const jsonData = { title: 'My Data', content: 'Some content' }
const uploaded = await uploadJsonToPinata(jsonData)
```

### Atom/Triple Retrieval

```typescript
import { getAtom, getTriple } from '@0xintuition/sdk'

const atom = await getAtom('atom-id-123')
const triple = await getTriple('triple-id-456')
```

## Project Structure

```
src/
├── app/                    # Next.js app directory
├── components/             # React components
│   ├── tabs/             # Tab components for different features
│   └── ...               # Other UI components
├── hooks/                 # Custom React hooks
├── lib/                   # Configuration and utilities
└── providers/             # Context providers
```

## Supported Networks

The application supports the following networks:

- **Ethereum Mainnet** (Chain ID: 1)
- **Base Mainnet** (Chain ID: 8453)
- **Arbitrum One** (Chain ID: 42161)
- **Sepolia Testnet** (Chain ID: 11155111)
- **Base Sepolia Testnet** (Chain ID: 84532)
- **Arbitrum Sepolia** (Chain ID: 421614)

## Error Handling

The application includes comprehensive error handling for common scenarios:

- **Network Issues**: Automatic detection and user guidance
- **Wallet Connection**: Clear instructions for wallet setup
- **Transaction Failures**: Detailed error messages with suggestions
- **Batch Operation Errors**: Specific handling for `EthMultiVault_AtomExists` errors

## Development

### Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

### Customization

The application is designed to be easily customizable:

1. **Add New Networks**: Update `src/lib/intuition-config.ts`
2. **Modify UI**: Edit components in `src/components/`
3. **Add Features**: Extend the SDK usage in tab components

## Troubleshooting

### Common Issues

1. **Wallet Connection Problems**:
   - Ensure WalletConnect Project ID is correctly set
   - Check network compatibility

2. **IPFS Upload Failures**:
   - Verify Pinata API token is valid
   - Check token permissions

3. **Transaction Failures**:
   - Ensure sufficient ETH for gas fees
   - Check network connectivity

### Getting Help

- Check the [Intuition SDK Documentation](https://tech.docs.intuition.systems/)
- Review the [Intuition Contracts](https://github.com/0xIntuition/intuition-beta-contracts)
- Join the [Intuition Discord](https://discord.gg/intuition)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.
