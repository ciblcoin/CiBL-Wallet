'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import WalletSelector from '@/components/Wallet/WalletSelector';
import Link from 'next/link';
import CreateChallenge from '@/components/CreateChallenge';
import ChallengeList from '@/components/ChallengeList';

export default function Home() {
  const [currentUser, setCurrentUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);
      } catch (error) {
        console.error('Error getting user:', error);
      } finally {
        setLoading(false);
      }
    };

    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setCurrentUser(session?.user || null);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const loadMessages = async () => {
      const { data } = await supabase
        .from('chat_messages')
        .select('*, profiles:user_id(username)')
        .order('created_at', { ascending: false })
        .limit(50);
      if (data) setMessages(data.reverse());
    };

    loadMessages();

    const channel = supabase
      .channel('public-chat-room')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        async (payload) => {
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', payload.new.user_id)
            .single();

          setMessages((prev) => [
            ...prev,
            {
              ...payload.new,
              profiles: { username: userProfile?.username || 'Unknown' },
            },
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    if (!currentUser?.id) {
      alert('Please sign in to send messages.');
      return;
    }

    const { error } = await supabase.from('chat_messages').insert([
      {
        user_id: currentUser.id,
        message: newMessage,
        room: 'general',
      },
    ]);

    if (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message: ' + error.message);
    } else {
      setNewMessage('');
    }
  };

  const testSupabaseConnection = async () => {
    console.log('🔍 Starting Supabase connection test...');
    try {
      const { data, error } = await supabase.from('profiles').select('*').limit(1);
      if (error) {
        console.error('❌ Supabase connection error:', error.message);
      } else {
        console.log('✅ Supabase connection successful! Response:', data);
      }
    } catch (err) {
      console.error('❌ Unexpected error during Supabase test:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg"></div>
              <h1 className="text-2xl font-bold">CiBL Wallet</h1>
            </div>
            <div className="flex items-center gap-4">
              {currentUser ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-300">
                    Welcome, {currentUser.email || 'User'}!
                  </span>
                  <button
                    onClick={() => supabase.auth.signOut()}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <Link
                  href="/auth/login"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg font-bold"
                >
                  Sign In
                </Link>
              )}
              <button
                onClick={testSupabaseConnection}
                className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 rounded-lg"
              >
                Test Connection
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Wallet Selector */}
        <div className="mb-8">
          <WalletSelector />
        </div>

        {/* Challenges Section */}
        <div className="mb-12 grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="p-6 bg-slate-800/30 rounded-2xl border border-blue-500/20">
              <ChallengeList currentUserId={currentUser?.id} />
            </div>
          </div>
          <div>
            <CreateChallenge currentUserId={currentUser?.id} />
          </div>
        </div>

        {/* Live Chat Section */}
        <div className="mb-12">
          <div className="p-6 bg-slate-800/30 rounded-2xl border border-blue-500/20">
            <h2 className="text-2xl font-bold text-white mb-4">💬 Live Chat</h2>
            
            <div className="mb-4 h-64 overflow-y-auto bg-slate-900/50 p-4 rounded-lg">
              {messages.length === 0 ? (
                <p className="text-slate-400 italic">No messages yet. Start the conversation!</p>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className="mb-3 p-3 bg-slate-800/40 rounded-lg">
                    <div className="flex justify-between text-sm text-slate-400 mb-1">
                      <span className="text-blue-300">
                        @{msg.profiles?.username || 'Unknown'}
                      </span>
                      <span>
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-slate-200">{msg.message}</p>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder={
                  currentUser
                    ? "Type your message..."
                    : "Please sign in to send messages"
                }
                disabled={!currentUser}
                className={`flex-1 p-3 rounded-lg text-white placeholder-slate-500 focus:outline-none ${
                  currentUser
                    ? 'bg-slate-900 border border-blue-500/30 focus:border-blue-500'
                    : 'bg-slate-800 border border-slate-700 cursor-not-allowed'
                }`}
              />
              <button
                onClick={sendMessage}
                disabled={!currentUser || !newMessage.trim()}
                className={`px-6 py-3 font-bold rounded-lg transition-all ${
                  currentUser && newMessage.trim()
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                Send
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              💡 Connect your wallet or sign in with email to participate in chat and challenges.
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-16 grid md:grid-cols-3 gap-6">
          <div className="bg-slate-800/50 p-6 rounded-xl border border-blue-500/10">
            <h3 className="text-xl font-bold text-blue-300 mb-3">🔒 Maximum Security</h3>
            <p className="text-slate-300">
              Your keys never leave your device. You maintain full control over your assets.
            </p>
          </div>
          
          <div className="bg-slate-800/50 p-6 rounded-xl border border-yellow-500/10">
            <h3 className="text-xl font-bold text-yellow-300 mb-3">⚡ Lightning Fast</h3>
            <p className="text-slate-300">
              Powered by Solana network, transactions are confirmed in under 2 seconds.
            </p>
          </div>
          
          <div className="bg-slate-800/50 p-6 rounded-xl border border-blue-500/10">
            <h3 className="text-xl font-bold text-blue-300 mb-3">🌐 Truly Decentralized</h3>
            <p className="text-slate-300">
              No sign-up required, no KYC, global access to digital assets.
            </p>
          </div>
        </div>

        {/* Call-to-Action Sections */}
        <div className="mt-16 grid md:grid-cols-2 gap-8">
          <div className="text-center p-8 bg-gradient-to-br from-blue-900/20 to-slate-800 rounded-2xl border border-blue-500/20">
            <h2 className="text-2xl font-bold text-white mb-4">Instant Token Swaps</h2>
            <p className="text-slate-300 mb-6">
              Swap between hundreds of tokens directly in CiBL Wallet with best rates.
              <span className="block text-yellow-300 mt-2">
                Low 0.5% service fee supports wallet development.
              </span>
            </p>
            <Link
              href="/swap"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-lg transition-all"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Go to Swap
            </Link>
          </div>

          <div className="text-center p-8 bg-gradient-to-br from-slate-800/40 to-blue-900/20 rounded-2xl border border-blue-500/20">
            <h2 className="text-2xl font-bold text-white mb-4">Explore dApps Securely</h2>
            <p className="text-slate-300 mb-6">
              Use our built-in browser to connect your CiBL Wallet directly to Solana applications.
            </p>
            <Link
              href="/browser"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-lg transition-all"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              Open dApp Browser
            </Link>
          </div>
        </div>
      </main>

      <footer className="mt-16 py-6 border-t border-slate-800 text-center text-slate-500 text-sm">
        <p>© 2025 CiBL Wallet. All rights reserved. Built on Solana.</p>
        <p className="mt-2 text-xs">
          This is a demo application. Use at your own risk.
        </p>
      </footer>
    </div>
  );
}