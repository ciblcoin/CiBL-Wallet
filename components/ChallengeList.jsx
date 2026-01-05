'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function ChallengeList({ currentUserId }) {
  const [challenges, setChallenges] = useState([]);
  const [joiningId, setJoiningId] = useState(null);
  const supabase = createClient();

  const fetchChallenges = async () => {
    try {
      const { data, error } = await supabase
        .from('challenges')
        .select(`
          *,
          creator:profiles!challenges_creator_id_fkey(username, solana_address),
          joiner:profiles!challenges_joiner_id_fkey(username, solana_address)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching challenges:', error);
        return;
      }

      if (data) {
        const activeChallenges = data.filter(
          (challenge) => challenge.status === 'open' || challenge.status === 'joined'
        );
        setChallenges(activeChallenges);
      }
    } catch (error) {
      console.error('Error in fetchChallenges:', error);
    }
  };

  const handleJoinChallenge = async (challengeId) => {
    if (!currentUserId) {
      alert('⚠️ Please sign in to join a challenge.');
      return;
    }

    setJoiningId(challengeId);
    try {
      const { data: challenge, error: checkError } = await supabase
        .from('challenges')
        .select('*')
        .eq('id', challengeId)
        .eq('status', 'open')
        .single();

      if (checkError || !challenge) {
        alert('❌ This challenge is no longer available.');
        setJoiningId(null);
        return;
      }

      if (challenge.creator_id === currentUserId) {
        alert("❌ You can't join your own challenge!");
        setJoiningId(null);
        return;
      }

      const { error: updateError } = await supabase
        .from('challenges')
        .update({
          joiner_id: currentUserId,
          status: 'joined',
          joined_at: new Date().toISOString(),
        })
        .eq('id', challengeId)
        .eq('status', 'open');

      if (updateError) {
        console.error('Join failed:', updateError);
        alert('❌ Could not join challenge. It may have been taken by another user.');
      } else {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', currentUserId)
          .single();

        await supabase.from('chat_messages').insert({
          user_id: currentUserId,
          message: `🎉 @${userProfile?.username || 'User'} has joined the ${challenge.asset_pair} challenge for $${challenge.amount}!`,
          room: 'general',
        });

        alert('✅ Successfully joined the challenge!');
      }
    } catch (error) {
      console.error('Error joining challenge:', error);
      alert('❌ An error occurred while joining the challenge.');
    } finally {
      setJoiningId(null);
    }
  };

  useEffect(() => {
    fetchChallenges();

    const channel = supabase
      .channel('challenges-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'challenges',
        },
        async (payload) => {
          console.log('Realtime update received:', payload);

          if (payload.eventType === 'INSERT') {
            const { data: newChallenge } = await supabase
              .from('challenges')
              .select(`
                *,
                creator:profiles!challenges_creator_id_fkey(username, solana_address)
              `)
              .eq('id', payload.new.id)
              .single();

            if (newChallenge && newChallenge.status === 'open') {
              setChallenges((prev) => [newChallenge, ...prev]);
            }
          }
          else if (payload.eventType === 'UPDATE') {
            setChallenges((prev) =>
              prev.map((challenge) =>
                challenge.id === payload.new.id
                  ? { ...challenge, ...payload.new }
                  : challenge
              )
            );

            if (payload.new.status === 'joined' && payload.old.status === 'open') {
              const { data: updatedChallenge } = await supabase
                .from('challenges')
                .select(`
                  *,
                  creator:profiles!challenges_creator_id_fkey(username),
                  joiner:profiles!challenges_joiner_id_fkey(username)
                `)
                .eq('id', payload.new.id)
                .single();

              if (updatedChallenge) {
                setChallenges((prev) =>
                  prev.map((challenge) =>
                    challenge.id === payload.new.id ? updatedChallenge : challenge
                  )
                );
              }
            }
          }
          else if (payload.eventType === 'DELETE') {
            setChallenges((prev) =>
              prev.filter((challenge) => challenge.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-white">🔥 Active Challenges</h3>
        <button
          onClick={fetchChallenges}
          className="px-3 py-1 text-sm bg-slate-700 hover:bg-slate-600 rounded-lg"
        >
          Refresh
        </button>
      </div>

      {challenges.length === 0 ? (
        <div className="p-6 text-center bg-slate-800/30 rounded-xl border border-slate-700">
          <p className="text-slate-400">No active challenges yet.</p>
          <p className="text-sm text-slate-500 mt-1">Be the first to create one!</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
          {challenges.map((challenge) => (
            <div
              key={challenge.id}
              className={`p-4 rounded-xl border transition-all ${
                challenge.status === 'open'
                  ? 'border-green-500/30 bg-green-500/5 hover:bg-green-500/10'
                  : 'border-gray-700 bg-slate-800/50'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{challenge.asset_pair}</span>
                    <span className="px-2 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-blue-600 to-purple-600">
                      ${challenge.amount}
                    </span>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        challenge.status === 'open'
                          ? 'bg-green-900/50 text-green-300'
                          : 'bg-gray-800 text-gray-300'
                      }`}
                    >
                      {challenge.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-slate-400">
                      Created by{' '}
                      <span className="text-blue-300">
                        @{challenge.creator?.username || 'Unknown'}
                      </span>
                      {challenge.creator?.solana_address && (
                        <span className="text-xs text-slate-500 ml-2">
                          ({challenge.creator.solana_address.slice(0, 8)}...)
                        </span>
                      )}
                    </p>

                    {challenge.status === 'joined' && challenge.joiner && (
                      <p className="text-sm text-yellow-400">
                        👑 Accepted by{' '}
                        <span className="text-yellow-300">
                          @{challenge.joiner?.username || 'Unknown'}
                        </span>
                        {challenge.joiner?.solana_address && (
                          <span className="text-xs text-slate-500 ml-2">
                            ({challenge.joiner.solana_address.slice(0, 8)}...)
                          </span>
                        )}
                      </p>
                    )}

                    <p className="text-xs text-slate-500">
                      Created: {new Date(challenge.created_at).toLocaleDateString()}
                      {challenge.expires_at && (
                        <> • Expires: {new Date(challenge.expires_at).toLocaleDateString()}</>
                      )}
                    </p>
                  </div>
                </div>

                <div className="ml-4">
                  {challenge.status === 'open' ? (
                    <button
                      onClick={() => handleJoinChallenge(challenge.id)}
                      disabled={joiningId === challenge.id || !currentUserId}
                      className={`px-4 py-2 rounded-lg font-bold text-white transition-all ${
                        joiningId === challenge.id
                          ? 'bg-gray-600 cursor-not-allowed'
                          : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
                      }`}
                    >
                      {joiningId === challenge.id ? (
                        <span className="flex items-center">
                          <span className="animate-spin mr-2">⟳</span>
                          Joining...
                        </span>
                      ) : (
                        '✅ JOIN'
                      )}
                    </button>
                  ) : (
                    <span className="px-4 py-2 bg-gray-700 rounded-lg font-bold text-gray-300 cursor-not-allowed">
                      ❌ CLOSED
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}