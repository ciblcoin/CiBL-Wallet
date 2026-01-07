'use client';

import { useState, useRef, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { createClient } from '@/lib/supabase/client';

// List of approved dApps for security
const APPROVED_DAPPS = [
  {
    id: 'raydium',
    name: 'Raydium',
    url: 'https://raydium.io/swap/',
    icon: '🔄',
    category: 'DeFi'
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    url: 'https://jup.ag/',
    icon: '♃',
    category: 'Aggregator'
  },
  {
    id: 'magiceden',
    name: 'Magic Eden',
    url: 'https://magiceden.io/',
    icon: '🖼️',
    category: 'NFT'
  },
  {
    id: 'orca',
    name: 'Orca',
    url: 'https://www.orca.so/',
    icon: '🐋',
    category: 'DeFi'
  },
  {
    id: 'solend',
    name: 'Solend',
    url: 'https://solend.fi/',
    icon: '🏦',
    category: 'Lending'
  },
  {
    id: 'marinade',
    name: 'Marinade',
    url: 'https://marinade.finance/',
    icon: '🌊',
    category: 'Staking'
  },
  {
    id: 'phantom',
    name: 'Phantom',
    url: 'https://phantom.app/',
    icon: '👻',
    category: 'Wallet'
  }
];

export default function DAppBrowser() {
  const [currentUrl, setCurrentUrl] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [showApprovedList, setShowApprovedList] = useState(true);
  const [securityWarning, setSecurityWarning] = useState('');
  
  const iframeRef = useRef(null);
  const { publicKey, wallet, connected } = useWallet();
  const supabase = createClient();

  // Initialize with first approved dApp
  useEffect(() => {
    if (APPROVED_DAPPS[0]) {
      setCurrentUrl(APPROVED_DAPPS[0].url);
      setUrlInput(APPROVED_DAPPS[0].url);
    }
  }, []);

  // Handle wallet connection to iframe
  useEffect(() => {
    if (connected && wallet && iframeRef.current) {
      injectWalletToIframe();
    }
  }, [connected, wallet]);

  // Inject wallet provider to iframe
  const injectWalletToIframe = () => {
    if (!iframeRef.current || !wallet || !publicKey) return;

    try {
      const iframe = iframeRef.current;
      const messageHandler = (event) => {
        // Handle messages from iframe (wallet connection requests)
        if (event.data.type === 'connect') {
          iframe.contentWindow.postMessage({
            type: 'connected',
            publicKey: publicKey.toString(),
            wallet: wallet.adapter.name
          }, '*');
        }
      };

      window.addEventListener('message', messageHandler);
      
      return () => {
        window.removeEventListener('message', messageHandler);
      };
    } catch (error) {
      console.error('Error injecting wallet:', error);
    }
  };

  // Navigate to URL with security checks
  const navigateToUrl = (url) => {
    if (!url) return;

    // Add https if missing
    let formattedUrl = url;
    if (!formattedUrl.startsWith('http')) {
      formattedUrl = 'https://' + formattedUrl;
    }

    // Security checks
    if (!isUrlSafe(formattedUrl)) {
      setSecurityWarning('This URL may not be safe. Only browse trusted dApps.');
      return;
    }

    setLoading(true);
    setCurrentUrl(formattedUrl);
    setUrlInput(formattedUrl);
    
    // Add to history
    setHistory(prev => {
      const newHistory = [...prev];
      if (!newHistory.some(item => item.url === formattedUrl)) {
        newHistory.unshift({
          url: formattedUrl,
          title: 'Loading...',
          timestamp: new Date().toISOString()
        });
        if (newHistory.length > 20) newHistory.pop();
      }
      return newHistory;
    });

    setSecurityWarning('');
  };

  // Check if URL is safe
  const isUrlSafe = (url) => {
    try {
      const urlObj = new URL(url);
      
      // Check if it's an approved dApp
      const isApproved = APPROVED_DAPPS.some(dapp => 
        urlObj.hostname.includes(new URL(dapp.url).hostname)
      );

      // Additional security checks
      const isHttps = urlObj.protocol === 'https:';
      const hasValidTLD = /\.(com|org|io|fi|app|xyz|dev|net)$/.test(urlObj.hostname);
      
      return isApproved || (isHttps && hasValidTLD);
    } catch {
      return false;
    }
  };

  // Handle iframe load
  const handleIframeLoad = () => {
    setLoading(false);
    
    // Update history with page title
    if (iframeRef.current) {
      try {
        const iframe = iframeRef.current;
        const title = iframe.contentDocument?.title || 'Unknown dApp';
        
        setHistory(prev => prev.map((item, index) => 
          index === 0 ? { ...item, title } : item
        ));
      } catch (error) {
        // Cross-origin restrictions may prevent accessing iframe document
      }
    }
  };

  // Handle back navigation
  const handleBack = () => {
    if (history.length > 1) {
      const previous = history[1];
      navigateToUrl(previous.url);
    }
  };

  // Handle forward navigation (simplified)
  const handleForward = () => {
    // In a real implementation, you'd maintain a forward stack
    // For simplicity, we'll just reload
    iframeRef.current?.contentWindow?.location?.reload();
  };

  // Handle refresh
  const handleRefresh = () => {
    iframeRef.current?.contentWindow?.location?.reload();
  };

  // Handle home (back to first approved dApp)
  const handleHome = () => {
    if (APPROVED_DAPPS[0]) {
      navigateToUrl(APPROVED_DAPPS[0].url);
    }
  };

  // Select approved dApp
  const selectDApp = (dapp) => {
    navigateToUrl(dapp.url);
    setShowApprovedList(false);
  };

  // Security warning component
  const SecurityWarning = () => {
    if (!securityWarning) return null;

    return (
      <div className="p-4 mb-4 bg-red-900/30 border border-red-700/50 rounded-lg">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="font-bold text-red-300">Security Warning</p>
            <p className="text-red-200 text-sm">{securityWarning}</p>
          </div>
          <button
            onClick={() => setSecurityWarning('')}
            className="ml-auto text-red-400 hover:text-red-300"
          >
            ✕
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 rounded-2xl border border-blue-500/20 overflow-hidden">
      {/* Browser Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/90">
        {/* Navigation Controls */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={handleBack}
            disabled={history.length <= 1}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ←
          </button>
          <button
            onClick={handleForward}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700"
          >
            →
          </button>
          <button
            onClick={handleRefresh}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700"
          >
            ↻
          </button>
          <button
            onClick={handleHome}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700"
          >
            🏠
          </button>
          
          {/* Wallet Status */}
          <div className="ml-auto flex items-center gap-2">
            {connected ? (
              <div className="flex items-center gap-2 px-3 py-1 bg-green-900/30 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-400">Connected</span>
              </div>
            ) : (
              <div className="px-3 py-1 bg-red-900/30 rounded-full">
                <span className="text-sm text-red-400">Wallet Disconnected</span>
              </div>
            )}
            
            <button
              onClick={() => setShowApprovedList(!showApprovedList)}
              className="px-3 py-1 bg-blue-900/30 rounded-lg text-sm"
            >
              {showApprovedList ? 'Hide Apps' : 'Show Apps'}
            </button>
          </div>
        </div>

        {/* URL Bar */}
        <div className="flex gap-2">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && navigateToUrl(urlInput)}
            placeholder="Enter dApp URL or select from list"
            className="flex-1 p-3 bg-slate-800 border border-slate-700 rounded-lg text-white"
          />
          <button
            onClick={() => navigateToUrl(urlInput)}
            className="px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg font-bold"
          >
            Go
          </button>
        </div>

        {/* Security Warning */}
        <SecurityWarning />
      </div>

      {/* Approved dApps List */}
      {showApprovedList && (
        <div className="p-4 border-b border-slate-800 bg-slate-900/80">
          <h3 className="font-bold text-white mb-3">Approved dApps</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {APPROVED_DAPPS.map((dapp) => (
              <button
                key={dapp.id}
                onClick={() => selectDApp(dapp)}
                className={`p-3 rounded-lg text-left transition-all ${
                  currentUrl.includes(dapp.url)
                    ? 'bg-blue-900/50 border border-blue-700'
                    : 'bg-slate-800/50 hover:bg-slate-800'
                }`}
              >
                <div className="text-2xl mb-2">{dapp.icon}</div>
                <div className="font-bold">{dapp.name}</div>
                <div className="text-xs text-slate-400">{dapp.category}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Browser Content */}
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-slate-400">Loading dApp...</p>
            </div>
          </div>
        )}

        {/* Security Overlay for unconnected wallet */}
        {!connected && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-20">
            <div className="text-center p-8 max-w-md">
              <div className="text-5xl mb-4">🔒</div>
              <h3 className="text-xl font-bold text-white mb-3">Wallet Required</h3>
              <p className="text-slate-400 mb-6">
                Connect your wallet to interact with dApps securely.
                Your wallet connection is sandboxed for safety.
              </p>
              <div className="p-4 bg-yellow-900/30 rounded-lg mb-6">
                <p className="text-yellow-300 text-sm">
                  ⚠️ Always verify transactions before signing. 
                  Only connect to trusted dApps.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Iframe */}
        <iframe
          ref={iframeRef}
          src={currentUrl}
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
          allow="clipboard-write; encrypted-media;"
          onLoad={handleIframeLoad}
          title="dApp Browser"
        />
      </div>

      {/* Browser Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/90 text-sm text-slate-500 flex justify-between">
        <div>
          {connected && publicKey && (
            <span className="text-green-400">
              Connected: {publicKey.toString().slice(0, 8)}...
            </span>
          )}
        </div>
        <div>
          {currentUrl && (
            <span className="text-blue-400">
              {new URL(currentUrl).hostname}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}