'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function ChallengeManager() {
  const [challenges, setChallenges] = useState([]);
  const [userWallet, setUserWallet] = useState(null);
  const [newChallenge, setNewChallenge] = useState({
    amount: 5,
    currency_pair: 'SOL/USDC',
    timeframe: 60 // ثانیه
  });

  useEffect(() => {
    loadChallenges();
    setupRealtimeSubscription();
  }, []);

  const loadChallenges = async () => {
    const { data, error } = await supabase
      .from('challenges')
      .select(`
        *,
        creator:profiles!challenges_creator_id_fkey(username, wallet_address),
        acceptor:profiles!challenges_acceptor_id_fkey(username, wallet_address)
      `)
      .order('created_at', { ascending: false });
    
    if (!error && data) setChallenges(data);
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('challenges_channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'challenges'
      }, () => {
        loadChallenges(); // ریفرش لیست
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  };

  const createChallenge = async () => {
    // ابتدا باید کاربر لاگین باشد
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('Please login first');
      return;
    }

    // گرفتن آدرس ولت کاربر
    // این بخش باید با کیف پول شما integrate شود
    const walletAddress = await getUserWalletAddress();

    const { error } = await supabase
      .from('challenges')
      .insert({
        creator_id: user.id,
        amount: newChallenge.amount,
        currency_pair: newChallenge.currency_pair,
        timeframe: newChallenge.timeframe,
        status: 'pending',
        entry_price: await getCurrentPrice(newChallenge.currency_pair)
      });

    if (!error) {
      alert('Challenge created successfully!');
      setNewChallenge({ amount: 5, currency_pair: 'SOL/USDC', timeframe: 60 });
    }
  };

  const acceptChallenge = async (challengeId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('challenges')
      .update({
        acceptor_id: user.id,
        status: 'active',
        started_at: new Date().toISOString()
      })
      .eq('id', challengeId);

    if (!error) {
      // شروع معامله - اینجا باید منطق معامله اجرا شود
      startTradingChallenge(challengeId);
    }
  };

  const startTradingChallenge = async (challengeId) => {
    // این تابع باید:
    // 1. معامله را روی بلاکچین اجرا کند
    // 2. نتیجه را در دیتابیس ذخیره کند
    // 3. برنده را مشخص کند
    
    // مثال:
    setTimeout(async () => {
      // بعد از 60 ثانیه (timeframe)
      const winner = Math.random() > 0.5 ? 'creator' : 'acceptor';
      
      await supabase
        .from('challenges')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          winner_id: winner === 'creator' ? challenge.creator_id : challenge.acceptor_id,
          creator_pnl: Math.random() * 10 - 5, // PNP تصادفی برای تست
          acceptor_pnl: Math.random() * 10 - 5
        })
        .eq('id', challengeId);
    }, 60000);
  };

  return (
    <div className="space-y-6">
      {/* بخش ایجاد چالش جدید */}
      <div className="border p-4 rounded-lg">
        <h3 className="text-lg font-bold mb-4">Create New Challenge</h3>
        <div className="space-y-3">
          <div>
            <label className="block mb-1">Amount (USD)</label>
            <input
              type="number"
              value={newChallenge.amount}
              onChange={(e) => setNewChallenge({...newChallenge, amount: e.target.value})}
              className="border p-2 rounded w-full"
              min="1"
              step="0.1"
            />
          </div>
          
          <div>
            <label className="block mb-1">Currency Pair</label>
            <select
              value={newChallenge.currency_pair}
              onChange={(e) => setNewChallenge({...newChallenge, currency_pair: e.target.value})}
              className="border p-2 rounded w-full"
            >
              <option value="SOL/USDC">SOL/USDC</option>
              <option value="SOL/USDT">SOL/USDT</option>
              <option value="BTC/USDC">BTC/USDC</option>
            </select>
          </div>
          
          <div>
            <label className="block mb-1">Timeframe (seconds)</label>
            <input
              type="number"
              value={newChallenge.timeframe}
              onChange={(e) => setNewChallenge({...newChallenge, timeframe: e.target.value})}
              className="border p-2 rounded w-full"
              min="30"
              step="10"
            />
          </div>
          
          <button
            onClick={createChallenge}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Create Challenge ($5 Entry)
          </button>
        </div>
      </div>

      {/* لیست چالش‌های موجود */}
      <div>
        <h3 className="text-lg font-bold mb-4">Available Challenges</h3>
        <div className="space-y-3">
          {challenges
            .filter(c => c.status === 'pending')
            .map(challenge => (
              <div key={challenge.id} className="border p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p><strong>{challenge.creator?.username}</strong> is challenging!</p>
                    <p>Amount: ${challenge.amount} | Pair: {challenge.currency_pair}</p>
                    <p>Time: {challenge.timeframe} seconds</p>
                  </div>
                  <button
                    onClick={() => acceptChallenge(challenge.id)}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    Accept Challenge
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}