'use client';

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import InternalWallet from './InternalWallet';
import Link from 'next/link';

export default function WalletSelector() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-4">
          Welcome to <span className="text-blue-400">CiBL Wallet</span>
        </h1>
        <p className="text-slate-300 text-lg">
          Your decentralized wallet with dual connection options
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Internal Wallet Card */}
        <div className="wallet-card">
          <div className="text-center mb-6">
            <div className="inline-block p-3 bg-blue-500/10 rounded-full mb-4">
              <span className="text-2xl">🔐</span>
            </div>
            <h2 className="text-2xl font-bold text-blue-300 mb-2">CiBL Internal Wallet</h2>
            <p className="text-slate-400">
              Create a new wallet or import existing recovery phrase
            </p>
          </div>
          <InternalWallet />
        </div>

        {/* External Connection Card */}
        <div className="wallet-card">
          <div className="text-center mb-6">
            <div className="inline-block p-3 bg-yellow-500/10 rounded-full mb-4">
              <span className="text-2xl">🔗</span>
            </div>
            <h2 className="text-2xl font-bold text-yellow-300 mb-2">External Wallet Connection</h2>
            <p className="text-slate-400">
              Connect with Phantom, Solflare, and other popular wallets
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="text-center">
              <WalletMultiButton className="btn-primary w-full !bg-blue-600 hover:!bg-blue-700 !rounded-lg" />
            </div>
            
            <div className="border-t border-slate-700 pt-4">
              <h3 className="font-semibold text-slate-300 mb-3">Supported Wallets:</h3>
              <div className="flex flex-wrap gap-3 justify-center">
                <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">Phantom</span>
                <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">Solflare</span>
                <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm">Backpack</span>
                <span className="px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-sm">Glow</span>
                <span className="px-3 py-1 bg-orange-500/20 text-orange-300 rounded-full text-sm">Coin98</span>
              </div>
            </div>
          </div>
          
          {/* Quick Links */}
          <div className="mt-6 pt-6 border-t border-slate-700">
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/swap"
                className="text-center p-2 bg-slate-800 hover:bg-slate-700 rounded transition-colors"
              >
                <div className="text-blue-400 font-medium">Swap Tokens</div>
                <div className="text-xs text-slate-400">0.5% fee</div>
              </Link>
              <Link
                href="/browser"
                className="text-center p-2 bg-slate-800 hover:bg-slate-700 rounded transition-colors"
              >
                <div className="text-blue-400 font-medium">dApp Browser</div>
                <div className="text-xs text-slate-400">Explore dApps</div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}