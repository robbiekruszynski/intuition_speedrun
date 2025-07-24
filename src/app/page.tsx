import { WalletConnect } from "@/components/wallet-connect";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Wallet Connect Demo
          </h1>
          <p className="text-lg text-gray-600">
            Connect your wallet to see your balance and network information
          </p>
        </div>
        
        <div className="flex justify-center">
          <WalletConnect />
        </div>
      </div>
    </div>
  );
}
