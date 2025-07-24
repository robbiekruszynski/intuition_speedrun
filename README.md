# Intuition SDK Showcase

A polished showcase application demonstrating the power of [Intuition Systems](https://www.intuition.systems/) SDK. This project provides a comprehensive walkthrough of Intuition's token-curated knowledge graph capabilities.

## Features

- **Wallet Integration**: Connect with any Web3 wallet using RainbowKit v2
- **Atoms**: Search and create fundamental units of knowledge
- **Triples**: Build relationships between atoms (Subject-Predicate-Object)
- **Vaults**: Organize and monetize collections of atoms and triples
- **Modern UI**: Polished interface with tabs and responsive design

## Tech Stack

- **Next.js 15** with TypeScript and App Router
- **RainbowKit v2** for wallet connectivity
- **Tailwind CSS** for styling
- **Intuition SDK** (@0xintuition/sdk) for knowledge graph operations

## Getting Started

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Set up environment**:
   ```bash
   # Create .env.local with your WalletConnect project ID
   echo "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id" > .env.local
   ```

3. **Run the development server**:
   ```bash
   pnpm dev
   ```

4. **Open your browser** and navigate to `http://localhost:3000`

## Project Structure

```
src/
├── app/                    # Next.js app router
├── components/
│   ├── tabs/              # Tab components for Atoms, Triples, Vaults
│   ├── intuition-showcase.tsx
│   └── wallet-connect.tsx
├── hooks/
│   └── use-intuition.ts   # Intuition SDK integration
└── providers/
    └── rainbowkit-provider.tsx
```

## SDK Integration Status

The showcase is currently set up with placeholder implementations. The Intuition SDK is installed and ready for integration:

- ✅ SDK installed and initialized
- ✅ UI components created
- ✅ Error handling implemented
- 🔄 SDK method implementations (in progress)

## Next Steps

1. Implement actual SDK method calls
2. Add code snippets for developers
3. Create comprehensive documentation
4. Add more advanced features

## Contributing

This is a showcase project for the Intuition SDK. The SDK itself should never be modified - only used as a dependency.

## License

MIT
