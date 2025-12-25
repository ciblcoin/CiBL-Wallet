'use client';
import { useState } from 'react';

export default function SimpleDappBrowser() {
  // Popular Solana dApps for quick access
  const popularDapps = [
    { name: 'Jupiter Swap', url: 'https://jup.ag' },
    { name: 'Raydium', url: 'https://raydium.io/swap/' },
    { name: 'Magic Eden', url: 'https://magiceden.io/' },
    { name: 'Solana Beach (Explorer)', url: 'https://solanabeach.io/' },
    { name: 'Solend (Lending)', url: 'https://solend.fi/' },
  ];

  const [currentUrl, setCurrentUrl] = useState(popularDapps[0].url);
  const [urlInput, setUrlInput] = useState('');

  const handleDappClick = (url) => {
    setCurrentUrl(url);
    setUrlInput(url);
  };

  const handleGoClick = () => {
    // Basic URL validation
    if (urlInput && (urlInput.startsWith('http://') || urlInput.startsWith('https://'))) {
      setCurrentUrl(urlInput);
    } else if (urlInput) {
      setCurrentUrl('https://' + urlInput);
      setUrlInput('https://' + urlInput);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Top Bar - URL Input and Go Button */}
      <div className="flex mb-6 space-x-4">
        <div className="flex-1">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGoClick()}
            placeholder="https://example.com"
            className="w-full p-3 bg-slate-800 border border-blue-500/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>
        <button
          onClick={handleGoClick}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-lg transition-all"
        >
          Go
        </button>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Left Panel - dApp List */}
        <div className="lg:col-span-1">
          <div className="wallet-card">
            <h3 className="text-xl font-bold text-blue-300 mb-4">Popular dApps</h3>
            <div className="space-y-2">
              {popularDapps.map((dapp) => (
                <button
                  key={dapp.url}
                  onClick={() => handleDappClick(dapp.url)}
                  className={`w-full text-left p-3 rounded transition-colors ${currentUrl === dapp.url ? 'bg-blue-600/20 border border-blue-500' : 'bg-slate-800 hover:bg-slate-700'}`}
                >
                  <div className="font-medium text-white">{dapp.name}</div>
                  <div className="text-xs text-slate-400 truncate">{dapp.url}</div>
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-6">
              Connect using your CiBL Wallet. Ensure you are on the correct website.
            </p>
          </div>
        </div>

        {/* Right Panel - WebView */}
        <div className="lg:col-span-3">
          <div className="wallet-card p-0 overflow-hidden">
            <div className="p-3 border-b border-slate-700 bg-slate-800/50">
              <div className="flex items-center space-x-2 text-sm text-slate-300">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <div className="ml-4 truncate">{currentUrl}</div>
              </div>
            </div>
            {/* Main iframe for displaying dApps */}
            <iframe
              src={currentUrl}
              title="dApp Browser"
              className="w-full h-[75vh] border-0"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              allow="clipboard-write;"
            />
          </div>
          {/* Security Note */}
          <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-700/30 rounded-lg text-sm text-yellow-200">
            <strong>Security Notice:</strong> Only connect your wallet to trusted dApps. Never enter your secret recovery phrase on any website. This browser provides basic access and your wallet adapter remains active for connection prompts.
          </div>
        </div>
      </div>
    </div>
  );
}