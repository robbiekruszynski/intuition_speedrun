import { IntuitionShowcase } from "@/components/intuition-showcase";
import { Navbar } from "@/components/navbar";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Navbar with Wallet Connection */}
      <Navbar />
      
      {/* Main Intuition Showcase */}
      <IntuitionShowcase />
    </div>
  );
}
