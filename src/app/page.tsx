import { IntuitionShowcase } from "@/components/intuition-showcase";
import { Navbar } from "@/components/navbar";

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Navbar with Wallet Connection */}
      <Navbar />
      
      {/* Main Intuition Showcase */}
      <IntuitionShowcase />
    </div>
  );
}
