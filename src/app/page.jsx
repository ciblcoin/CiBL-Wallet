'use client';

import WalletSelector from '@/components/Wallet/WalletSelector';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';
import { useEffect, useState } from 'react';

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  // Test Supabase connection
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

  // Listen for real-time chat messages
  useEffect(() => {
    const channel = supabase
      .channel('public-chat-room')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        (payload) => {
          console.log('New message received!', payload.new);
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    // Load existing messages
    const loadMessages = async () => {
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(50);
      if (data) setMessages(data);
    };
    loadMessages();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Send new message
  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    // In a real app, get user_id from authenticated user
    const mockUserId = '00000000-0000-0000-0000-000000000000';

    const { error } = await supabase.from('chat_messages').insert([
      {
        user_id: mockUserId,
        message: newMessage,
        room: 'general',
      },
    ]);

    if (error) {
      console.error('Error sending message:', error);
    } else {
      setNewMessage('');
    }
  };

  return (
    <div>
      {/* Supabase Test Button */}
      <button
        onClick={testSupabaseConnection}
        className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
      >
        Test Supabase Connection
      </button>

      {/* Real-time Chat Section */}
      <div className="mt-12 p-6 bg-slate-800/30 rounded-xl border border-blue-500/20">
        <h2 className="text-2xl font-bold text-white mb-4">💬 Live Chat</h2>
        
        <div className="mb-4 h-64 overflow-y-auto bg-slate-900/50 p-4 rounded-lg">
          {messages.length === 0 ? (
            <p className="text-slate-400 italic">No messages yet. Start the conversation!</p>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="mb-3 p-3 bg-slate-800/40 rounded-lg">
                <div className="flex justify-between text-sm text-slate-400 mb-1">
                  <span>User: {msg.user_id?.slice(0, 8)}...</span>
                  <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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
            placeholder="Type your message..."
            className="flex-1 p-3 bg-slate-900 border border-blue-500/30 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={sendMessage}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-lg transition-all"
          >
            Send
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          💡 This is a demo. In a real app, users would be authenticated with their wallet.
        </p>
      </div>

      <WalletSelector />
      
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
        {/* Swap Section */}
        <div className="text-center p-8 bg-gradient-to-br from-blue-900/20 to-slate-800 rounded-2xl border border-blue-500/20">
          <h2 className="text-2xl font-bold text-white mb-4">
            Instant Token Swaps
          </h2>
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

        {/* Browser Section - NEW */}
        <div className="text-center p-8 bg-gradient-to-br from-slate-800/40 to-blue-900/20 rounded-2xl border border-blue-500/20">
          <h2 className="text-2xl font-bold text-white mb-4">
            Explore dApps Securely
          </h2>
          <p className="text-slate-300 mb-6">
            Use our built-in browser to connect your CiBL Wallet directly to Solana applications like Raydium or Magic Eden.
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
    </div>
  );
}