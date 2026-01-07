'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import useUser from '@/hooks/useUser';

export default function ChallengeSlideout({ isOpen, onClose }) {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joiningChallenge, setJoiningChallenge] = useState(null);
  const [activeTab, setActiveTab] = useState('open'); // 'open', 'active', 'completed'
  
  const supabase = createClient();
  const { user, profile, isAuthenticated } = useUser();

  // Load challenges
  useEffect(() => {
    if (!isOpen) return;

    const loadChallenges = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('challenges')
          .select(`
            *,
            creator:profiles!challenges_creator_id_fkey(
              id,
              username,
              solana_address
            ),
            acceptor:profiles!challenges_acceptor_id_fkey(
              id,
              username,
              solana_address
            ),
            winner:profiles!challenges_winner_id_fkey(
              username
            )
          `)
          .order('created_at', { ascending: false });

        // Filter based on active tab
        if (activeTab === 'open') {
          query = query.in('status', ['open']);
        } else if (activeTab === 'active') {
          query = query.in('status', ['joined', 'active']);
        } else if (activeTab === 'completed') {
          query = query.in('status', ['completed', 'expired', 'cancelled']);
        }

        const { data, error } = await query;

        if (error) throw error;
        setChallenges(data || []);
      } catch (error) {
        console.error('Error loading challenges:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChallenges();

    // Real-time subscription for challenges
    const channel = supabase
      .channel('challenges_slideout_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'challenges',
        },
        () => {
          loadChallenges();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, activeTab, supabase]);

  // Join a challenge
  const joinChallenge = async (challengeId) => {
    if (!isAuthenticated || !user?.id) {
      alert('Please connect your wallet to join challenges');
      return;
    }

    setJoiningChallenge(challengeId);
    
    try {
      // Use the claim_challenge function to prevent race conditions
      const { data: result, error } = await supabase.rpc(
        'claim_challenge',
        {
          p_challenge_id: challengeId,
          p_acceptor_id: user.id
        }
      );

      if (error) throw error;

      if (!result.success) {
        alert(result.error || 'Failed to join challenge');
        return;
      }

      // Send system message to chat
      const challenge = challenges.find(c => c.id === challengeId);
      if (challenge) {
        await supabase
          .from('chat_messages')
          .insert({
            user_id: user.id,
            message: `🎉 @${profile?.username || 'User'} joined the ${challenge.asset_pair} challenge for $${challenge.amount_usd}!`,
            room: 'general',
            message_type: 'system_join',
            challenge_id: challengeId
          });
      }

      alert('Successfully joined the challenge!');

    } catch (error) {
      console.error('Error joining challenge:', error);
      alert('Failed to join challenge. It may have been taken by another user.');
    } finally {
      setJoiningChallenge(null);
    }
  };

  // Create a new challenge
  const createChallenge = async () => {
    if (!isAuthenticated || !user?.id) {
      alert('Please connect your wallet to create challenges');
      return;
    }

    const amount = 10; // Default amount
    const assetPair = 'SOL/USDC';
    
    try {
      const { data: challenge, error } = await supabase
        .from('challenges')
        .insert({
          creator_id: user.id,
          amount_usd: amount,
          asset_pair: assetPair,
          timeframe_seconds: 60,
          status: 'open',
          expires_at: new Date(Date.now() + 5 * 60000).toISOString() // 5 minutes
        })
        .select()
        .single();

      if (error) throw error;

      // Send system message to chat
      await supabase
        .from('chat_messages')
        .insert({
          user_id: user.id,
          message: `🚀 New challenge created: $${amount} in ${assetPair}! Join now!`,
          room: 'general',
          message_type: 'system_challenge',
          challenge_id: challenge.id
        });

      alert('Challenge created successfully!');
      
    } catch (error) {
      console.error('Error creating challenge:', error);
      alert('Failed to create challenge');
    }
  };

  // Format time remaining
  const formatTimeRemaining = (expiresAt) => {
    if (!expiresAt) return '';
    
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffMs = expires - now;
    
    if (diffMs <= 0) return 'Expired';
    
    const diffMins = Math.floor(diffMs / 60000);
    const diffSecs = Math.floor((diffMs % 60000) / 1000);
    
    return `${diffMins}:${diffSecs.toString().padStart(2, '0')}`;
  };

  // Handle overlay click
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity"
          onClick={handleOverlayClick}
        />
      )}

      {/* Slideout Panel */}
      <div
        className={`
          fixed top-0 right-0 h-full w-[85%] max-w-md
          bg-gradient-to-b from-slate-900 to-slate-950
          border-l border-yellow-500/20
          shadow-2xl z-50
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
          flex flex-col
        `}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center">
                <span className="text-xl">⚔️</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Trading Challenges</h2>
                <p className="text-sm text-slate-400">Compete with other traders</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="Close challenges"
            >
              <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex mt-4 space-x-2">
            {['open', 'active', 'completed'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab
                    ? 'bg-gradient-to-r from-yellow-600 to-orange-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                <span className="ml-1 text-xs opacity-75">
                  ({challenges.filter(c => 
                    tab === 'open' ? c.status === 'open' :
                    tab === 'active' ? ['joined', 'active'].includes(c.status) :
                    ['completed', 'expired', 'cancelled'].includes(c.status)
                  ).length})
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Challenges List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-yellow-500 mx-auto"></div>
                <p className="mt-3 text-slate-400">Loading challenges...</p>
              </div>
            </div>
          ) : challenges.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-5xl mb-4 opacity-30">⚔️</div>
              <h3 className="text-lg font-bold text-white mb-2">
                {activeTab === 'open' ? 'No open challenges' :
                 activeTab === 'active' ? 'No active challenges' :
                 'No completed challenges'}
              </h3>
              <p className="text-slate-400 mb-6">
                {activeTab === 'open' ? 'Be the first to create one!' :
                 activeTab === 'active' ? 'Join an open challenge to get started' :
                 'Complete some challenges to see history here'}
              </p>
              
              {activeTab === 'open' && isAuthenticated && (
                <button
                  onClick={createChallenge}
                  className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg font-bold hover:from-yellow-700 hover:to-orange-700 transition-all"
                >
                  Create First Challenge
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {challenges.map((challenge) => {
                const isCreator = challenge.creator_id === user?.id;
                const isAcceptor = challenge.acceptor_id === user?.id;
                const canJoin = !isCreator && challenge.status === 'open' && isAuthenticated;
                
                return (
                  <div
                    key={challenge.id}
                    className={`p-4 rounded-xl border ${
                      challenge.status === 'open'
                        ? 'border-green-500/30 bg-green-500/5'
                        : challenge.status === 'joined' || challenge.status === 'active'
                        ? 'border-yellow-500/30 bg-yellow-500/5'
                        : 'border-slate-700 bg-slate-800/40'
                    }`}
                  >
                    {/* Challenge Header */}
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-white">{challenge.asset_pair}</span>
                          <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                            challenge.status === 'open' ? 'bg-green-600' :
                            challenge.status === 'joined' ? 'bg-yellow-600' :
                            challenge.status === 'active' ? 'bg-orange-600' :
                            'bg-slate-700'
                          }`}>
                            {challenge.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-2xl font-bold text-yellow-400">
                          ${challenge.amount_usd}
                        </div>
                      </div>
                      
                      {challenge.status === 'open' && challenge.expires_at && (
                        <div className="text-right">
                          <div className="text-sm text-slate-400">Expires in</div>
                          <div className="text-lg font-mono font-bold text-red-400">
                            {formatTimeRemaining(challenge.expires_at)}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Challenge Details */}
                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Creator:</span>
                        <span className="text-blue-300">
                          @{challenge.creator?.username || 'Unknown'}
                        </span>
                      </div>
                      
                      {challenge.acceptor && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Acceptor:</span>
                          <span className="text-green-300">
                            @{challenge.acceptor?.username || 'Unknown'}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex justify-between">
                        <span className="text-slate-400">Time:</span>
                        <span>{challenge.timeframe_seconds} seconds</span>
                      </div>
                      
                      {challenge.winner && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Winner:</span>
                          <span className="text-yellow-300">
                            @{challenge.winner?.username}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-3 border-t border-slate-700/50">
                      {challenge.status === 'open' && (
                        <button
                          onClick={() => joinChallenge(challenge.id)}
                          disabled={!canJoin || joiningChallenge === challenge.id}
                          className={`w-full py-2 rounded-lg font-bold transition-all ${
                            canJoin && joiningChallenge !== challenge.id
                              ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                              : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          {joiningChallenge === challenge.id ? (
                            <span className="flex items-center justify-center">
                              <span className="animate-spin mr-2">⟳</span>
                              Joining...
                            </span>
                          ) : isCreator ? (
                            'Your Challenge'
                          ) : isAuthenticated ? (
                            'Join Challenge'
                          ) : (
                            'Connect Wallet to Join'
                          )}
                        </button>
                      )}
                      
                      {(isCreator || isAcceptor) && challenge.status === 'active' && (
                        <button className="w-full py-2 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg font-bold">
                          Trade Now
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Create Challenge Button (for authenticated users) */}
        {isAuthenticated && activeTab === 'open' && (
          <div className="p-4 border-t border-slate-800">
            <button
              onClick={createChallenge}
              className="w-full py-3 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-xl font-bold hover:from-yellow-700 hover:to-orange-700 transition-all flex items-center justify-center gap-2"
            >
              <span>⚔️</span>
              Create New Challenge ($10 SOL/USDC)
            </button>
          </div>
        )}
      </div>
    </>
  );
}