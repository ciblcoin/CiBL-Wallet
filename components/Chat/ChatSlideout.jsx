'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import useUser from '@/hooks/useUser';

export default function ChatSlideout({ isOpen, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  
  const supabase = createClient();
  const { user, profile, isAuthenticated } = useUser();

  // Load initial messages
  useEffect(() => {
    if (!isOpen) return;

    const loadMessages = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select(`
            *,
            profiles:user_id (
              id,
              username,
              solana_address,
              user_type
            )
          `)
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) throw error;
        
        if (data) {
          // Reverse to show oldest first (for proper scrolling)
          setMessages(data.reverse());
        }
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();

    // Real-time subscription for new messages
    const channel = supabase
      .channel('chat_slideout_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        async (payload) => {
          // Get user profile for the new message
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('id, username, solana_address, user_type')
            .eq('id', payload.new.user_id)
            .single();

          const newMessageWithProfile = {
            ...payload.new,
            profiles: userProfile || { username: 'Unknown' }
          };

          setMessages(prev => [...prev, newMessageWithProfile]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, supabase]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = async (e) => {
    e?.preventDefault();
    
    if (!newMessage.trim()) {
      alert('Please enter a message');
      return;
    }
    
    if (!isAuthenticated || !user?.id) {
      alert('Please connect your wallet or sign in to send messages');
      return;
    }

    if (newMessage.length > 300) {
      alert('Message is too long (max 300 characters)');
      return;
    }

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          user_id: user.id,
          message: newMessage.trim(),
          room: 'general',
          message_type: 'user_message',
          created_at: new Date().toISOString()
        });

      if (error) throw error;
      
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  };

  // Format time display
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle overlay click to close
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle swipe to close on mobile
  const [touchStart, setTouchStart] = useState(null);
  
  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    if (!touchStart) return;
    
    const touchEnd = e.touches[0].clientX;
    const diff = touchStart - touchEnd;
    
    // If swiped more than 50px to the right, close
    if (diff > 50) {
      onClose();
      setTouchStart(null);
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
          border-l border-blue-500/20
          shadow-2xl z-50
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
          flex flex-col
        `}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                <span className="text-xl">💬</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Community Chat</h2>
                <p className="text-sm text-slate-400">Connect with traders</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="Close chat"
            >
              <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {!isAuthenticated && (
            <div className="mt-3 p-2 bg-yellow-900/30 border border-yellow-700/50 rounded">
              <p className="text-yellow-300 text-sm">
                Connect your wallet to participate in chat
              </p>
            </div>
          )}
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-3 text-slate-400">Loading messages...</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-5xl mb-4 opacity-30">💬</div>
              <h3 className="text-lg font-bold text-white mb-2">No messages yet</h3>
              <p className="text-slate-400">
                Be the first to start the conversation!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => {
                const isCurrentUser = message.user_id === user?.id;
                const isSystemMessage = message.message_type !== 'user_message';
                
                return (
                  <div
                    key={message.id}
                    className={`p-3 rounded-lg ${
                      isSystemMessage
                        ? 'bg-blue-900/20 border border-blue-700/30'
                        : isCurrentUser
                        ? 'bg-blue-900/30 border border-blue-600/30'
                        : 'bg-slate-800/40 border border-slate-700/30'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2">
                        {isSystemMessage ? (
                          <span className="text-xs px-2 py-1 bg-blue-600 rounded-full">System</span>
                        ) : (
                          <>
                            <span className={`font-bold ${
                              isCurrentUser ? 'text-blue-300' : 'text-green-300'
                            }`}>
                              @{message.profiles?.username || 'Unknown'}
                            </span>
                            {message.profiles?.user_type === 'wallet_only' && (
                              <span className="text-xs px-2 py-1 bg-slate-700 rounded-full">Wallet</span>
                            )}
                          </>
                        )}
                      </div>
                      <span className="text-xs text-slate-500">
                        {formatTime(message.created_at)}
                      </span>
                    </div>
                    <p className="text-slate-200 text-sm mt-2">
                      {message.message}
                    </p>
                    
                    {/* Show challenge info if message is related to a challenge */}
                    {message.challenge_id && (
                      <div className="mt-2 pt-2 border-t border-slate-700/50">
                        <span className="text-xs text-blue-400">
                          Related to challenge #{message.challenge_id.slice(0, 8)}...
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-slate-800 bg-slate-900/70 p-4">
          <form onSubmit={sendMessage} className="space-y-3">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={
                    isAuthenticated 
                      ? "Type your message... (Press Enter to send)"
                      : "Connect your wallet to chat..."
                  }
                  disabled={!isAuthenticated}
                  maxLength={300}
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                  rows={2}
                />
                <div className="absolute bottom-2 right-2 text-xs text-slate-500">
                  {newMessage.length}/300
                </div>
              </div>
              <button
                type="submit"
                disabled={!isAuthenticated || !newMessage.trim() || loading}
                className={`self-end px-4 py-3 rounded-lg font-bold transition-all ${
                  isAuthenticated && newMessage.trim() && !loading
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                Send
              </button>
            </div>
            
            {isAuthenticated && profile && (
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>
                  Chatting as: <span className="text-blue-300">@{profile.username}</span>
                </span>
                <span>
                  {messages.length} messages
                </span>
              </div>
            )}
          </form>
        </div>
      </div>
    </>
  );
}