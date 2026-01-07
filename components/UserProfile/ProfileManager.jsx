'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function ProfileManager({ user, profile, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [newUsername, setNewUsername] = useState(profile?.username || '');
  const [newEmail, setNewEmail] = useState(profile?.email || '');
  const [loading, setLoading] = useState(false);
  
  const supabase = createClient();

  const handleUpdateProfile = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      // اگر کاربر wallet-only است و می‌خواهد ایمیل اضافه کند
      if (profile?.user_type === 'wallet_only' && newEmail) {
        // درخواست تغییر به full user
        const { data: updatedProfile } = await supabase
          .from('profiles')
          .update({
            email: newEmail,
            temp_email: newEmail,
            user_type: 'full',
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id)
          .select()
          .single();

        // ارسال ایمیل تایید
        await supabase.auth.resetPasswordForEmail(newEmail, {
          redirectTo: `${window.location.origin}/auth/confirm-email`
        });

        alert('Verification email sent! Please check your inbox.');
        onUpdate(updatedProfile);
      }

      // اگر کاربر email-only است و می‌خواهد یوزرنیم تغییر دهد
      if (newUsername !== profile.username) {
        // چک کردن یکتایی
        const { data: existing } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', newUsername)
          .neq('id', user.id)
          .single();

        if (existing) {
          throw new Error('Username already taken');
        }

        const { data: updatedProfile } = await supabase
          .from('profiles')
          .update({
            username: newUsername,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id)
          .select()
          .single();

        onUpdate(updatedProfile);
        alert('Username updated successfully!');
      }

      setEditing(false);
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-slate-800/50 rounded-xl border border-slate-700">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-lg font-bold text-white">👤 Your Profile</h4>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm"
          >
            Edit
          </button>
        )}
      </div>

      {!editing ? (
        <div className="space-y-3">
          <div>
            <p className="text-sm text-slate-400">Username</p>
            <p className="text-white font-bold">{profile?.username}</p>
          </div>
          
          <div>
            <p className="text-sm text-slate-400">Account Type</p>
            <p className="text-white">
              {profile?.user_type === 'wallet_only' ? 'Wallet Only' : 
               profile?.user_type === 'email_only' ? 'Email Only' : 
               'Full Account'}
            </p>
          </div>

          {profile?.email && (
            <div>
              <p className="text-sm text-slate-400">Email</p>
              <p className="text-white">{profile.email}</p>
            </div>
          )}

          {profile?.solana_address && (
            <div>
              <p className="text-sm text-slate-400">Wallet Address</p>
              <p className="text-sm font-mono text-slate-300">
                {profile.solana_address.slice(0, 12)}...{profile.solana_address.slice(-8)}
              </p>
            </div>
          )}

          {profile?.user_type === 'wallet_only' && (
            <div className="p-3 bg-yellow-900/30 rounded-lg">
              <p className="text-yellow-300 text-sm">
                ⚠️ Add your email to unlock custom username and email notifications
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Username</label>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-white"
            />
          </div>

          {profile?.user_type === 'wallet_only' && (
            <div>
              <label className="block text-sm text-slate-400 mb-2">Add Email</label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-white"
                placeholder="your@email.com"
              />
              <p className="text-xs text-slate-500 mt-1">
                Adding email allows custom username and unlocks all features
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setEditing(false)}
              className="flex-1 py-2 bg-slate-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateProfile}
              disabled={loading}
              className="flex-1 py-2 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg font-bold"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}