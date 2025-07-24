import { IntuitionShowcase } from "@/components/intuition-showcase";
import { WalletConnect } from "@/components/wallet-connect";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Wallet Connect - Keep it for authentication */}
      <div className="absolute top-4 right-4 z-10">
        <WalletConnect />
      </div>
      
      {/* Main Intuition Showcase */}
      <IntuitionShowcase />
    </div>
  );
}
