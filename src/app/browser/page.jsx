'use client';
import SimpleDappBrowser from '@/components/Browser/SimpleDappBrowser';
import Link from 'next/link';

export default function DappBrowserPage() {
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
                dApp Browser
              </span>
            </h1>
            <p className="text-slate-300 max-w-2xl mx-auto">
              Access the decentralized web. Your CiBL Wallet is ready to connect to these applications.
            </p>
          </div>
        </div>
        {/* Browser Component */}
        <SimpleDappBrowser />
      </div>
    </div>
  );
}