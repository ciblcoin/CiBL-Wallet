'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function CreateChallenge({ currentUserId }) {
  const [amount, setAmount] = useState(10);
  const [assetPair, setAssetPair] = useState('SOL/USDC');
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleCreateChallenge = async () => {
    if (!currentUserId) {
      alert('Please sign in to create a challenge.');
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from('challenges')
      .insert([
        {
          creator_id: currentUserId,
          amount: amount,
          asset_pair: assetPair,
          status: 'open',
          expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating challenge:', error);
      alert('Failed to create challenge: ' + error.message);
    } else {
      console.log('Challenge created:', data);
      alert('Challenge created successfully! It is now visible to all users.');

      const { error: chatError } = await supabase
        .from('chat_messages')
        .insert([
          {
            user_id: currentUserId,
            message: `🚀 New challenge created: ${amount} USD in ${assetPair}! Click JOIN to compete.`,
            room: 'general',
          },
        ]);
        
      if (chatError) console.error('Could not post system message:', chatError);
      
      setAmount(10);
    }
    setLoading(false);
  };

  return (
    <div className="p-6 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-green-500/20 shadow-xl">
      <h3 className="text-2xl font-bold text-white mb-2">Create Trading Challenge</h3>
      <p className="text-slate-300 mb-6">Challenge other users with a real-time trading duel.</p>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">Trading Pair</label>
          <select
            value={assetPair}
            onChange={(e) => setAssetPair(e.target.value)}
            className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-green-500"
          >
            <option value="SOL/USDC">SOL / USDC</option>
            <option value="ETH/USDC">ETH / USDC</option>
            <option value="BTC/USD">BTC / USD</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">Stake Amount (USD)</label>
          <input
            type="range"
            min="5"
            max="100"
            step="5"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-sm text-slate-500 mt-1">
            <span>$5</span>
            <span className="text-lg font-bold text-green-400">${amount}</span>
            <span>$100</span>
          </div>
        </div>

        <button
          onClick={handleCreateChallenge}
          disabled={loading || !currentUserId}
          className={`w-full py-3 px-4 rounded-lg font-bold text-white transition-all ${
            !currentUserId
              ? 'bg-gray-700 cursor-not-allowed'
              : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
          }`}
        >
          {loading ? 'Creating Challenge...' : 'Create Challenge'}
        </button>
        
        {!currentUserId && (
          <p className="text-sm text-yellow-500 text-center mt-2">Please sign in to create a challenge.</p>
        )}
      </div>
    </div>
  );
}