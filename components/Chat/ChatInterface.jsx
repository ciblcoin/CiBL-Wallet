'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    // دریافت کاربر فعلی
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    
    getUser();
    
    // Subscribe به پیام‌های جدید
    const channel = supabase
      .channel('chat_messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages'
      }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();

    // بارگذاری پیام‌های موجود
    loadMessages();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        profiles(username)
      `)
      .order('created_at', { ascending: true })
      .limit(50);
    
    if (!error && data) setMessages(data);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !userId) return;

    const { error } = await supabase
      .from('chat_messages')
      .insert({
        user_id: userId,
        message: newMessage,
        created_at: new Date().toISOString()
      });

    if (!error) {
      setNewMessage('');
    }
  };

  return (
    <div className="border rounded-lg p-4 h-[500px] flex flex-col">
      <div className="flex-1 overflow-y-auto mb-4">
        {messages.map((msg) => (
          <div key={msg.id} className="mb-2">
            <strong>{msg.profiles?.username || 'Anonymous'}: </strong>
            <span>{msg.message}</span>
          </div>
        ))}
      </div>
      
      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 border p-2 rounded"
          placeholder="Type your message..."
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Send
        </button>
      </form>
    </div>
  );
}