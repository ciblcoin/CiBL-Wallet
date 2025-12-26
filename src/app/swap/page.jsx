'use client';

import SwapInterface from '@/components/Swap/SwapInterface';
import Link from 'next/link';

export default function SwapPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-blue-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-blue-400 hover:text-blue-300 mb-6"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
          
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-blue-400 to-yellow-400 bg-clip-text text-transparent">
                Instant Token Swap
              </span>
            </h1>
            <p className="text-slate-300 max-w-2xl mx-auto">
              Swap between hundreds of tokens on Solana with best rates powered by Jupiter.
              <span className="block text-yellow-300 font-medium mt-1">
                CiBL Service Fee: 0.5% per swap (Supports development)
              </span>
            </p>
          </div>
        </div>

        {/* Main swap interface */}
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Swap panel */}
            <div className="lg:col-span-2">
              <SwapInterface />
            </div>

            {/* Side info */}
            <div className="space-y-6">
              {/* Fees */}
              <div className="wallet-card">
                <h3 className="text-xl font-bold text-blue-300 mb-4">Fee Structure</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Jupiter Fee</span>
                    <span className="text-green-400">0.1%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">CiBL Service Fee</span>
                    <span className="text-yellow-300 font-bold">0.5%</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-slate-700">
                    <span className="text-white font-medium">Total Fee</span>
                    <span className="text-white font-bold">0.6%</span>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-4">
                  Service fees support development and maintenance of CiBL Wallet.
                </p>
              </div>

              {/* Stats */}
              <div className="wallet-card">
                <h3 className="text-xl font-bold text-blue-300 mb-4">How Fees Work</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Fee Address</span>
                    <span className="text-blue-300 text-xs truncate ml-2">
                      3oPNk1Db...QGF
                    </span>
                  </div>
                  <div className="text-slate-400 text-sm">
                    <p className="mb-2">• 0.5% is automatically deducted from each swap</p>
                    <p className="mb-2">• Fees are sent to CiBL treasury wallet</p>
                    <p>• You see the net amount after fee deduction</p>
                  </div>
                </div>
              </div>

              {/* Top tokens */}
              <div className="wallet-card">
                <h3 className="text-xl font-bold text-blue-300 mb-4">Popular Tokens</h3>
                <div className="space-y-3">
                  {[
                    { symbol: 'SOL', name: 'Solana', change: '+2.1%' },
                    { symbol: 'USDC', name: 'USD Coin', change: '+0.0%' },
                    { symbol: 'USDT', name: 'Tether', change: '+0.0%' },
                    { symbol: 'JUP', name: 'Jupiter', change: '+3.5%' },
                    { symbol: 'RAY', name: 'Raydium', change: '+1.8%' }
                  ].map((token) => (
                    <div key={token.symbol} className="flex items-center justify-between p-2 hover:bg-slate-800 rounded transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                          {token.symbol.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-white">{token.symbol}</div>
                          <div className="text-xs text-slate-400">{token.name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`${token.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                          {token.change}
                        </div>
                        <div className="text-xs text-slate-400">24h</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Info */}
              <div className="wallet-card bg-blue-900/10 border-blue-500/30">
                <h3 className="text-xl font-bold text-blue-300 mb-3">💡 Pro Tip</h3>
                <p className="text-sm text-slate-300">
                  Connect your external wallet (Phantom, Solflare) for larger swaps, or use CiBL internal wallet for small daily transactions.
                </p>
                <div className="mt-4 p-3 bg-blue-900/20 rounded">
                  <p className="text-xs text-blue-300">
                    <strong>Note:</strong> Minimum swap amount is 0.01 SOL. Slippage tolerance can be adjusted in settings.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}