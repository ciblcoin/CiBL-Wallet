'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useWallet } from '@solana/wallet-adapter-react';

export default function WalletAuth({ onSuccess, onBack }) {
  const [step, setStep] = useState('connect'); // 'connect', 'create', 'import', 'complete'
  const [loading, setLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [importMnemonic, setImportMnemonic] = useState('');
  
  const supabase = createClient();
  const { publicKey, connect, disconnect, connected } = useWallet();

  // اتصال کیف پول خارجی
  const handleConnectWallet = async () => {
    if (connected && publicKey) {
      await handleExistingWallet(publicKey.toString());
    } else {
      alert('Please connect your wallet first');
    }
  };

  const handleExistingWallet = async (address) => {
    setLoading(true);
    try {
      // چک کردن وجود کاربر با این آدرس
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('*')
        .eq('solana_address', address)
        .single();

      if (existingUser) {
        // کاربر وجود دارد - لاگین کند
        await completeWalletAuth(existingUser);
      } else {
        // کاربر جدید - ثبت‌نام کند
        setWalletAddress(address);
        setStep('complete');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // ساخت کیف پول جدید داخلی
  const handleCreateWallet = async () => {
    setLoading(true);
    try {
      // ساخت کیف پول جدید با Solana Web3.js
      const { Keypair } = await import('@solana/web3.js');
      const keypair = Keypair.generate();
      const mnemonicPhrase = await generateMnemonic(); // تابع تولید mnemonic
      
      setMnemonic(mnemonicPhrase);
      setWalletAddress(keypair.publicKey.toString());
      setStep('backup');
    } catch (error) {
      console.error('Error creating wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImportWallet = async () => {
    if (!importMnemonic.trim()) {
      alert('Please enter your recovery phrase');
      return;
    }

    setLoading(true);
    try {
      // بازیابی کیف پول از mnemonic
      const { Keypair } = await import('@solana/web3.js');
      const keypair = await Keypair.fromSeed(
        // تبدیل mnemonic به seed
        await mnemonicToSeed(importMnemonic)
      );
      
      setWalletAddress(keypair.publicKey.toString());
      await handleExistingWallet(keypair.publicKey.toString());
    } catch (error) {
      alert('Invalid recovery phrase');
    } finally {
      setLoading(false);
    }
  };

  const completeWalletAuth = async (profile = null) => {
    setLoading(true);
    try {
      let finalProfile = profile;

      if (!profile) {
        // ساخت پروفایل جدید برای کیف پول
        const username = `wallet_${walletAddress.slice(0, 6)}${walletAddress.slice(-4)}`;
        
        const { data: newProfile } = await supabase
          .from('profiles')
          .insert({
            solana_address: walletAddress,
            default_wallet_address: walletAddress,
            username: username,
            user_type: 'wallet_only',
            wallet_connected: true,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        finalProfile = newProfile;
      }

      onSuccess({
        ...finalProfile,
        authType: 'wallet',
        requiresEmail: false
      });
    } catch (error) {
      console.error('Error completing auth:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 bg-slate-800/50 rounded-2xl border border-blue-500/20 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="text-slate-400 hover:text-white"
        >
          ← Back
        </button>
        <h3 className="text-xl font-bold text-white">Wallet Authentication</h3>
        <div className="w-6"></div>
      </div>

      {step === 'connect' && (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">👛</span>
            </div>
            <h4 className="text-lg font-bold text-white mb-2">
              Connect Your Wallet
            </h4>
            <p className="text-slate-400">
              Choose how you want to connect to CiBL Wallet
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleConnectWallet}
              disabled={!connected || loading}
              className="w-full p-4 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-between hover:from-blue-700 hover:to-blue-800 disabled:opacity-50"
            >
              <div className="flex items-center">
                <span className="text-2xl mr-3">🔗</span>
                <div className="text-left">
                  <div className="font-bold">External Wallet</div>
                  <div className="text-sm opacity-80">Phantom, Solflare, etc.</div>
                </div>
              </div>
              <span>→</span>
            </button>

            <button
              onClick={() => setStep('create')}
              className="w-full p-4 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg flex items-center justify-between hover:from-green-700 hover:to-emerald-700"
            >
              <div className="flex items-center">
                <span className="text-2xl mr-3">🆕</span>
                <div className="text-left">
                  <div className="font-bold">Create New Wallet</div>
                  <div className="text-sm opacity-80">Generate a new wallet inside CiBL</div>
                </div>
              </div>
              <span>→</span>
            </button>

            <button
              onClick={() => setStep('import')}
              className="w-full p-4 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg flex items-center justify-between hover:from-yellow-700 hover:to-orange-700"
            >
              <div className="flex items-center">
                <span className="text-2xl mr-3">📥</span>
                <div className="text-left">
                  <div className="font-bold">Import Existing Wallet</div>
                  <div className="text-sm opacity-80">Use recovery phrase</div>
                </div>
              </div>
              <span>→</span>
            </button>
          </div>
        </div>
      )}

      {step === 'create' && (
        <div className="space-y-6">
          <h4 className="text-lg font-bold text-white">Create New Wallet</h4>
          
          <div className="p-4 bg-yellow-900/30 border border-yellow-700 rounded-lg">
            <p className="text-yellow-300 text-sm">
              ⚠️ You will see a recovery phrase. Save it securely! 
              It cannot be recovered if lost.
            </p>
          </div>

          <button
            onClick={handleCreateWallet}
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg font-bold"
          >
            {loading ? 'Generating...' : 'Generate Wallet'}
          </button>
        </div>
      )}

      {step === 'backup' && mnemonic && (
        <div className="space-y-6">
          <h4 className="text-lg font-bold text-white">🔒 Backup Your Recovery Phrase</h4>
          
          <div className="p-4 bg-slate-900 border border-slate-700 rounded-lg">
            <div className="grid grid-cols-3 gap-2 mb-4">
              {mnemonic.split(' ').map((word, index) => (
                <div key={index} className="p-2 bg-slate-800 rounded text-center">
                  <span className="text-xs text-slate-400 mr-1">{index + 1}.</span>
                  <span className="font-mono">{word}</span>
                </div>
              ))}
            </div>
            <p className="text-red-400 text-sm text-center">
              ⚠️ Write this down and store it securely!
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigator.clipboard.writeText(mnemonic)}
              className="flex-1 py-2 bg-slate-700 rounded-lg"
            >
              Copy
            </button>
            <button
              onClick={() => completeWalletAuth()}
              className="flex-1 py-2 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg font-bold"
            >
              I've Saved It
            </button>
          </div>
        </div>
      )}

      {step === 'import' && (
        <div className="space-y-6">
          <h4 className="text-lg font-bold text-white">Import Wallet</h4>
          
          <textarea
            value={importMnemonic}
            onChange={(e) => setImportMnemonic(e.target.value)}
            placeholder="Enter your 12 or 24 word recovery phrase"
            className="w-full h-32 p-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500"
            rows={4}
          />
          
          <button
            onClick={handleImportWallet}
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg font-bold"
          >
            {loading ? 'Importing...' : 'Import Wallet'}
          </button>
        </div>
      )}

      {step === 'complete' && (
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto">
            <span className="text-3xl">✅</span>
          </div>
          
          <div>
            <h4 className="text-lg font-bold text-white mb-2">Wallet Connected!</h4>
            <p className="text-slate-400">
              Your wallet address: <br />
              <code className="text-sm bg-slate-900 p-2 rounded mt-1 inline-block">
                {walletAddress.slice(0, 12)}...{walletAddress.slice(-8)}
              </code>
            </p>
          </div>

          <div className="p-4 bg-blue-900/30 rounded-lg border border-blue-700">
            <p className="text-sm">
              <span className="text-blue-300 font-bold">Your username:</span>{' '}
              <span className="text-white">wallet_{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
            </p>
            <p className="text-slate-400 text-sm mt-2">
              Want a custom username? Add your email later in profile settings.
            </p>
          </div>

          <button
            onClick={() => completeWalletAuth()}
            className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg font-bold"
          >
            Continue to Chat & Challenges
          </button>
        </div>
      )}
    </div>
  );
}