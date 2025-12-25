'use client';

import WalletSelector from '@/components/Wallet/WalletSelector';
import Link from 'next/link';

export default function Home() {
  return (
    <div>
      <WalletSelector />
      
      {/* Features Grid */}
      <div className="mt-16 grid md:grid-cols-3 gap-6">
        <div className="bg-slate-800/50 p-6 rounded-xl border border-blue-500/10">
          <h3 className="text-xl font-bold text-blue-300 mb-3">🔒 Maximum Security</h3>
          <p className="text-slate-300">
            Your keys never leave your device. You maintain full control over your assets.
          </p>
        </div>
        
        <div className="bg-slate-800/50 p-6 rounded-xl border border-yellow-500/10">
          <h3 className="text-xl font-bold text-yellow-300 mb-3">⚡ Lightning Fast</h3>
          <p className="text-slate-300">
            Powered by Solana network, transactions are confirmed in under 2 seconds.
          </p>
        </div>
        
        <div className="bg-slate-800/50 p-6 rounded-xl border border-blue-500/10">
          <h3 className="text-xl font-bold text-blue-300 mb-3">🌐 Truly Decentralized</h3>
          <p className="text-slate-300">
            No sign-up required, no KYC, global access to digital assets.
          </p>
        </div>
      </div>

      {/* Call-to-Action Sections */}
      <div className="mt-16 grid md:grid-cols-2 gap-8">
        {/* Swap Section */}
        <div className="text-center p-8 bg-gradient-to-br from-blue-900/20 to-slate-800 rounded-2xl border border-blue-500/20">
          <h2 className="text-2xl font-bold text-white mb-4">
            Instant Token Swaps
          </h2>
          <p className="text-slate-300 mb-6">
            Swap between hundreds of tokens directly in CiBL Wallet with best rates.
            <span className="block text-yellow-300 mt-2">
              Low 0.5% service fee supports wallet development.
            </span>
          </p>
          <Link
            href="/swap"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-lg transition-all"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Go to Swap
          </Link>
        </div>

        {/* Browser Section - NEW */}
        <div className="text-center p-8 bg-gradient-to-br from-slate-800/40 to-blue-900/20 rounded-2xl border border-blue-500/20">
          <h2 className="text-2xl font-bold text-white mb-4">
            Explore dApps Securely
          </h2>
          <p className="text-slate-300 mb-6">
            Use our built-in browser to connect your CiBL Wallet directly to Solana applications like Raydium or Magic Eden.
          </p>
          <Link
            href="/browser"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-lg transition-all"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
            Open dApp Browser
          </Link>
        </div>
      </div>
    </div>
  );
}