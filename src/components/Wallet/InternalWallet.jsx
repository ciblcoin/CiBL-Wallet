'use client';

import { useState } from 'react';
import { walletInstance } from '@/utils/ciblWallet';
import { SolanaClient } from '@/utils/solanaClient';

export default function InternalWallet() {
  const [step, setStep] = useState('select'); // select, create, import, dashboard
  const [mnemonic, setMnemonic] = useState('');
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleCreateWallet = async () => {
    setLoading(true);
    const result = await walletInstance.createNewWallet();
    if (result.success) {
      setMnemonic(result.mnemonic);
      setStep('backup');
    }
    setLoading(false);
  };

  const handleImport = async () => {
    if (!mnemonic.trim()) return;
    
    setLoading(true);
    const result = await walletInstance.importFromMnemonic(mnemonic.trim());
    if (result.success) {
      const bal = await SolanaClient.getBalance(result.publicKey);
      setBalance(bal);
      setStep('dashboard');
    }
    setLoading(false);
  };

  const handleLogout = () => {
    walletInstance.clearWallet();
    setStep('select');
    setMnemonic('');
    setBalance(0);
  };

  if (step === 'select') {
    return (
      <div className="wallet-card max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-center mb-6 text-blue-300">CiBL Internal Wallet</h2>
        <div className="space-y-4">
          <button
            onClick={handleCreateWallet}
            disabled={loading}
            className="btn-primary w-full py-3"
          >
            {loading ? 'Creating...' : 'Create New Wallet'}
          </button>
          <button
            onClick={() => setStep('import')}
            className="btn-secondary w-full py-3"
          >
            Import Recovery Phrase
          </button>
        </div>
      </div>
    );
  }

  if (step === 'backup') {
    return (
      <div className="wallet-card max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-center mb-4 text-yellow-300">Save Your Recovery Phrase!</h2>
        <div className="bg-slate-900 p-4 rounded-lg mb-6">
          <p className="text-center font-mono text-lg leading-8">{mnemonic}</p>
        </div>
        <p className="text-red-400 text-sm mb-6 text-center">
          ⚠️ Write down these words and keep them safe. If you lose them, you'll lose access to your assets.
          <br />
          <span className="text-yellow-300">Never share this phrase with anyone!</span>
        </p>
        <div className="flex space-x-4">
          <button
            onClick={() => {
              // Make sure wallet is properly initialized
              if (walletInstance.isInitialized()) {
                setStep('dashboard');
              }
            }}
            className="btn-primary flex-1"
          >
            Continue to Dashboard
          </button>
          <button
            onClick={handleLogout}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (step === 'import') {
    return (
      <div className="wallet-card max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-center mb-6 text-blue-300">Import Recovery Phrase</h2>
        <textarea
          value={mnemonic}
          onChange={(e) => setMnemonic(e.target.value)}
          placeholder="Enter your 12 or 24 words here..."
          className="w-full h-32 p-3 bg-slate-900 border border-blue-500/30 rounded-lg text-white placeholder-slate-400"
          rows={4}
        />
        <button
          onClick={handleImport}
          disabled={loading || !mnemonic.trim()}
          className="btn-primary w-full mt-4 py-3"
        >
          {loading ? 'Importing...' : 'Import Wallet'}
        </button>
        <button
          onClick={() => setStep('select')}
          className="btn-secondary w-full mt-2 py-3"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (step === 'dashboard') {
    const publicKey = walletInstance.getPublicKey();
    
    return (
      <div className="wallet-card max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-blue-300">Wallet Dashboard</h2>
          <button
            onClick={handleLogout}
            className="btn-secondary px-4 py-2"
          >
            Logout
          </button>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-blue-900/30 to-slate-800 p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-blue-200 mb-2">SOL Balance</h3>
            <p className="text-3xl font-bold">{balance.toFixed(4)}</p>
            <p className="text-slate-400 mt-2">≈ ${(balance * 150).toFixed(2)}</p>
          </div>
          
          <div className="bg-gradient-to-br from-yellow-900/20 to-slate-800 p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-yellow-200 mb-2">Public Address</h3>
            <p className="font-mono text-sm break-all bg-slate-900/50 p-2 rounded">
              {publicKey}
            </p>
            <button
              onClick={() => navigator.clipboard.writeText(publicKey || '')}
              className="mt-2 text-xs text-blue-400 hover:text-blue-300"
            >
              Copy Address
            </button>
          </div>
        </div>
        
        <div className="mt-8 grid grid-cols-2 gap-4">
          <button className="btn-primary py-3">Send</button>
          <button className="btn-secondary py-3">Receive</button>
        </div>
        
        <div className="mt-6 p-4 bg-slate-900/50 rounded-lg">
          <h3 className="text-lg font-semibold text-slate-300 mb-2">Wallet Info</h3>
          <div className="text-sm text-slate-400">
            <p>• This is your internal CiBL Wallet</p>
            <p>• Keys are stored locally in your browser</p>
            <p>• For enhanced security, consider using a hardware wallet</p>
          </div>
        </div>
      </div>
    );
  }
}