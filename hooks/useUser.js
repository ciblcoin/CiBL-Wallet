'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function useUser() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Load profile from Supabase
  const loadProfile = useCallback(async (profileId) => {
    if (!profileId) return null;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single();
    
    if (error) {
      console.error('Error loading profile:', error);
      return null;
    }
    
    setProfile(data);
    return data;
  }, [supabase]);

  // Check user from localStorage (wallet)
  const checkWalletUser = useCallback(async () => {
    const walletProfileId = localStorage.getItem('cibl_wallet_profile_id');
    const walletAddress = localStorage.getItem('cibl_wallet_address');
    
    if (walletProfileId && walletAddress) {
      const userObj = {
        id: walletProfileId,
        walletAddress: walletAddress,
        type: 'wallet',
        authType: 'wallet_only'
      };
      
      setUser(userObj);
      await loadProfile(walletProfileId);
      return userObj;
    }
    
    return null;
  }, [loadProfile]);

  // Check user from Supabase Auth (email)
  const checkEmailUser = useCallback(async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (authUser) {
      // Load profile associated with auth user
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('auth_id', authUser.id)
        .single();
      
      if (profileData) {
        const userObj = {
          id: profileData.id,
          email: authUser.email,
          type: 'email',
          authType: profileData.user_type,
          authId: authUser.id
        };
        
        setUser(userObj);
        setProfile(profileData);
        return userObj;
      }
    }
    
    return null;
  }, [supabase]);

  // Main user loading function
  const loadUser = useCallback(async () => {
    setLoading(true);
    
    try {
      // First check wallet (priority to wallet)
      const walletUser = await checkWalletUser();
      if (walletUser) {
        setLoading(false);
        return;
      }
      
      // If no wallet, check email
      const emailUser = await checkEmailUser();
      if (emailUser) {
        setLoading(false);
        return;
      }
      
      // No user found
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error('Error loading user:', error);
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [checkWalletUser, checkEmailUser]);

  // Function to connect new wallet
  const connectWallet = useCallback(async (walletAddress) => {
    if (!walletAddress) return null;
    
    try {
      // Call Supabase function to get/create profile
      const { data: profileId, error } = await supabase.rpc(
        'get_wallet_profile',
        { wallet_address: walletAddress }
      );
      
      if (error) {
        console.error('Error getting wallet profile:', error);
        return null;
      }
      
      // Save to localStorage
      localStorage.setItem('cibl_wallet_profile_id', profileId);
      localStorage.setItem('cibl_wallet_address', walletAddress);
      
      // Create user object
      const userObj = {
        id: profileId,
        walletAddress: walletAddress,
        type: 'wallet',
        authType: 'wallet_only'
      };
      
      // Update state
      setUser(userObj);
      await loadProfile(profileId);
      
      // Dispatch event for other components
      window.dispatchEvent(new CustomEvent('wallet-connected', {
        detail: { profileId, walletAddress, user: userObj }
      }));
      
      return userObj;
      
    } catch (error) {
      console.error('Error connecting wallet:', error);
      return null;
    }
  }, [supabase, loadProfile]);

  // Function for logout
  const logout = useCallback(async (type = 'all') => {
    if (type === 'wallet' || type === 'all') {
      localStorage.removeItem('cibl_wallet_profile_id');
      localStorage.removeItem('cibl_wallet_address');
    }
    
    if (type === 'email' || type === 'all') {
      await supabase.auth.signOut();
    }
    
    setUser(null);
    setProfile(null);
    
    window.dispatchEvent(new CustomEvent('user-logged-out'));
  }, [supabase]);

  // Listen to auth changes
  useEffect(() => {
    loadUser();
    
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN') {
        await loadUser();
      } else if (event === 'SIGNED_OUT') {
        // Only clear email state, keep wallet
        setUser(prev => prev?.type === 'wallet' ? prev : null);
        setProfile(prev => prev?.user_type === 'wallet_only' ? prev : null);
      }
    });
    
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [loadUser]);

  return {
    user,
    profile,
    loading,
    connectWallet,
    logout,
    refreshUser: loadUser,
    isAuthenticated: !!user,
    isWalletOnly: user?.authType === 'wallet_only',
    isEmailUser: user?.type === 'email'
  };
}