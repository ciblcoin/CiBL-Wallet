'use client';

import { useState } from 'react';
import { walletCore } from '@/utils/walletCore';
import { createClient } from '@/lib/supabase/client';
import useUser from '@/hooks/useUser';

export default function CreateWalletFlow({ onComplete, onBack }) {
  const [step, setStep] = useState('method'); // 'method', 'create', 'import', 'backup', 'complete'
  const [walletName, setWalletName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [importPhrase, setImportPhrase] = useState('');
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [privateKey, setPrivateKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const supabase = createClient();
  const { connectWallet } = useUser();

  const handleCreateWallet = async () => {
    if (!walletName.trim()) {
      setError('Please enter a wallet name');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const result = await walletCore.generateNewWallet();
      
      if (!result.success) {
        setError(result.error);
        return;
      }
      
      setMnemonic(result.mnemonic);
      setPrivateKey(JSON.stringify(result.secretKey));
      setStep('backup');
      
      // Store wallet info in localStorage temporarily
      localStorage.setItem('temp_wallet_data', JSON.stringify({
        name: walletName,
        publicKey: result.publicKey,
        secretKey: result.secretKey,
        mnemonic: result.mnemonic
      }));
      
    } catch (error) {
      setError('Failed to create wallet: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImportWallet = async () => {
    const words = importPhrase.trim().split(/\s+/);
    if (words.length !== 12 && words.length !== 24) {
      setError('Please enter a valid 12 or 24 word recovery phrase');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const result = await walletCore.restoreFromMnemonic(importPhrase);
      
      if (!result.success) {
        setError(result.error);
        return;
      }
      
      // Connect to Supabase
      await connectWallet(result.publicKey);
      
      // Store in localStorage
      localStorage.setItem('cibl_wallet_profile_id', result.publicKey);
      localStorage.setItem('cibl_wallet_address', result.publicKey);
      localStorage.setItem('cibl_wallet_secret', JSON.stringify(result.secretKey));
      
      setStep('complete');
      
    } catch (error) {
      setError('Failed to import wallet: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleWalletCreated = async () => {
    setLoading(true);
    
    try {
      const tempData = JSON.parse(localStorage.getItem('temp_wallet_data') || '{}');
      
      if (!tempData.publicKey) {
        throw new Error('No wallet data found');
      }
      
      // Connect to Supabase
      await connectWallet(tempData.publicKey);
      
      // Store in localStorage
      localStorage.setItem('cibl_wallet_profile_id', tempData.publicKey);
      localStorage.setItem('cibl_wallet_address', tempData.publicKey);
      localStorage.setItem('cibl_wallet_secret', JSON.stringify(tempData.secretKey));
      
      // Clean up temp data
      localStorage.removeItem('temp_wallet_data');
      
      setStep('complete');
      
    } catch (error) {
      setError('Failed to finalize wallet: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 text-white p-4">
      <div className="max-w-md mx-auto pt-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-yellow-500 mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl font-bold">C</span>
          </div>
          <h1 className="text-3xl font-bold">CiBL Wallet</h1>
          <p className="text-slate-400 mt-2">Your secure Solana wallet</p>
        </div>

        {/* Step 1: Choose Method */}
        {step === 'method' && (
          <div className="space-y-6">
            <button
              onClick={() => setStep('create')}
              className="w-full p-6 bg-slate-800/50 rounded-xl border border-blue-500/30 hover:border-yellow-500 transition-all text-left"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xl font-bold">Create New Wallet</div>
                  <div className="text-slate-400 text-sm mt-1">Generate a new wallet with recovery phrase</div>
                </div>
                <div className="text-2xl">🆕</div>
              </div>
            </button>
            
            <button
              onClick={() => setStep('import')}
              className="w-full p-6 bg-slate-800/50 rounded-xl border border-blue-500/30 hover:border-yellow-500 transition-all text-left"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xl font-bold">Import Wallet</div>
                  <div className="text-slate-400 text-sm mt-1">Use existing recovery phrase</div>
                </div>
                <div className="text-2xl">📥</div>
              </div>
            </button>
            
            {onBack && (
              <button
                onClick={onBack}
                className="w-full py-3 mt-6 bg-slate-800 rounded-lg"
              >
                Back
              </button>
            )}
          </div>
        )}

        {/* Step 2: Create Wallet */}
        {step === 'create' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Create New Wallet</h2>
            
            {error && (
              <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg">
                <p className="text-red-300">{error}</p>
              </div>
            )}
            
            <div>
              <label className="block text-sm text-slate-400 mb-2">Wallet Name</label>
              <input
                type="text"
                value={walletName}
                onChange={(e) => setWalletName(e.target.value)}
                className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg"
                placeholder="My CiBL Wallet"
              />
            </div>
            
            <div>
              <label className="block text-sm text-slate-400 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg"
                placeholder="At least 8 characters"
              />
            </div>
            
            <div>
              <label className="block text-sm text-slate-400 mb-2">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg"
                placeholder="Re-enter your password"
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setStep('method')}
                className="flex-1 py-3 bg-slate-800 rounded-lg"
              >
                Back
              </button>
              <button
                onClick={handleCreateWallet}
                disabled={loading}
                className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg font-bold disabled:opacity-50"
              >
                {loading ? 'Generating...' : 'Create Wallet'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Backup Mnemonic */}
        {step === 'backup' && mnemonic && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center">🔒 Secret Recovery Phrase</h2>
            
            <div className="p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
              <p className="text-yellow-300 text-sm">
                <span className="font-bold">⚠️ IMPORTANT:</span> Write down these words in order and store them securely. 
                Never share them with anyone!
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-3 p-4 bg-slate-900 rounded-lg">
              {mnemonic.split(' ').map((word, index) => (
                <div key={index} className="text-center p-3 bg-slate-800 rounded">
                  <span className="text-xs text-slate-500 mr-1">{index + 1}.</span>
                  <span className="font-mono">{word}</span>
                </div>
              ))}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => navigator.clipboard.writeText(mnemonic)}
                className="flex-1 py-3 bg-slate-800 rounded-lg"
              >
                Copy to Clipboard
              </button>
              <button
                onClick={() => setStep('privateKey')}
                className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg font-bold"
              >
                I've Saved It
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Show Private Key */}
        {step === 'privateKey' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Private Key</h2>
            
            <div className="p-4 bg-red-900/20 border border-red-700/50 rounded-lg">
              <p className="text-red-300 text-sm">
                <span className="font-bold">⚠️ EXTREME CAUTION:</span> Never share your private key! 
                Anyone with this key can access your funds.
              </p>
            </div>
            
            <div className="p-4 bg-slate-900 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-400 text-sm">Private Key (JSON Array):</span>
                <button
                  onClick={() => setShowPrivateKey(!showPrivateKey)}
                  className="text-sm text-blue-400"
                >
                  {showPrivateKey ? 'Hide' : 'Show'}
                </button>
              </div>
              <div className="font-mono text-xs break-all bg-slate-800 p-3 rounded max-h-32 overflow-y-auto">
                {showPrivateKey ? privateKey : '•'.repeat(64)}
              </div>
            </div>
            
            <button
              onClick={handleWalletCreated}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg font-bold"
            >
              {loading ? 'Finalizing...' : 'Continue to Wallet'}
            </button>
          </div>
        )}

        {/* Step 5: Import Wallet */}
        {step === 'import' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Import Wallet</h2>
            
            {error && (
              <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg">
                <p className="text-red-300">{error}</p>
              </div>
            )}
            
            <div>
              <label className="block text-sm text-slate-400 mb-2">Recovery Phrase</label>
              <textarea
                value={importPhrase}
                onChange={(e) => setImportPhrase(e.target.value)}
                className="w-full h-32 p-3 bg-slate-900 border border-slate-700 rounded-lg"
                placeholder="Enter your 12 or 24 word recovery phrase"
                rows={4}
              />
              <p className="text-xs text-slate-500 mt-1">
                Separate each word with a space
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setStep('method')}
                className="flex-1 py-3 bg-slate-800 rounded-lg"
              >
                Back
              </button>
              <button
                onClick={handleImportWallet}
                disabled={loading}
                className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg font-bold disabled:opacity-50"
              >
                {loading ? 'Importing...' : 'Import Wallet'}
              </button>
            </div>
          </div>
        )}

        {/* Step 6: Complete */}
        {step === 'complete' && (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 mx-auto flex items-center justify-center">
              <span className="text-3xl">✅</span>
            </div>
            
            <h2 className="text-2xl font-bold">Wallet Ready!</h2>
            <p className="text-slate-400">
              Your CiBL Wallet has been created successfully.
            </p>
            
            <button
              onClick={onComplete}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg font-bold"
            >
              Open Wallet Dashboard
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <p className="text-center text-slate-500 text-sm">
            By proceeding, you agree to our{' '}
            <a href="#" className="text-blue-400">Terms of Service</a>{' '}
            and{' '}
            <a href="#" className="text-blue-400">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}