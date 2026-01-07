'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useWallet } from '@solana/wallet-adapter-react';

export default function LinkWalletModal({ userId, onSuccess, skipForNow }) {
  const [step, setStep] = useState('choose'); // 'choose', 'connect', 'create', 'import'
  const [loading, setLoading] = useState(false);
  const { publicKey, connect, connected } = useWallet();
  
  const supabase = createClient();

  const handleLinkExternalWallet = async () => {
    if (!connected || !publicKey) {
      alert('Please connect your wallet first');
      return;
    }

    setLoading(true);
    try {
      // لینک کردن کیف پول به پروفایل
      const { data: updatedProfile } = await supabase
        .from('profiles')
        .update({
          solana_address: publicKey.toString(),
          default_wallet_address: publicKey.toString(),
          wallet_connected: true,
          user_type: 'full',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      onSuccess(updatedProfile);
    } catch (error) {
      console.error('Error linking wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  if (step === 'choose') {
    return (
      <div className="p-8 bg-slate-800/70 rounded-2xl border border-blue-500/30">
        <h3 className="text-xl font-bold text-white mb-4">🔗 Connect a Wallet</h3>
        <p className="text-slate-400 mb-6">
          To participate in trading challenges, you need to connect a Solana wallet.
        </p>

        <div className="space-y-4">
          <button
            onClick={() => setStep('connect')}
            className="w-full p-4 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-between hover:from-blue-700 hover:to-blue-800"
          >
            <div className="flex items-center">
              <span className="text-2xl mr-3">🔗</span>
              <div className="text-left">
                <div className="font-bold">Connect External Wallet</div>
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
            onClick={skipForNow}
            className="w-full p-4 bg-slate-700 rounded-lg hover:bg-slate-600"
          >
            Skip for now (chat only)
          </button>
        </div>
      </div>
    );
  }

  // ... بقیه کامپوننت مشابه WalletAuth اما برای لینک کردن
}