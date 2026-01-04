import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [sessionExpiresAt, setSessionExpiresAt] = useState(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      // Validate profile exists for existing session
      if (session?.user) {
        try {
          await validateUserProfile(session.user.id);
          setSession(session);
          setUser(session.user);
          setSessionExpiresAt(session.expires_at ? new Date(session.expires_at * 1000) : null);
        } catch (error) {
          // Profile doesn't exist, clear session
          console.error('Profile validation failed on session load:', error);
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setSessionExpiresAt(null);
          toast.error('Your account is no longer active. Please contact support.');
        }
      } else {
        setSession(null);
        setUser(null);
        setSessionExpiresAt(null);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Only log in development
      if (import.meta.env.MODE !== 'production') {
        console.log('Auth state changed:', event);
      }
      
      // Validate profile on sign in events
      if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        try {
          await validateUserProfile(session.user.id);
          setSession(session);
          setUser(session.user);
          setSessionExpiresAt(session.expires_at ? new Date(session.expires_at * 1000) : null);
        } catch (error) {
          console.error('Profile validation failed:', error);
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setSessionExpiresAt(null);
          if (event === 'TOKEN_REFRESHED') {
            toast.error('Your account is no longer active.');
          }
          return;
        }
      } else {
        setSession(session);
        setUser(session?.user ?? null);
        setSessionExpiresAt(session?.expires_at ? new Date(session.expires_at * 1000) : null);
      }
      
      setLoading(false);

      // Show notifications for auth events
      if (event === 'SIGNED_IN') {
        toast.success('Successfully signed in!');
      } else if (event === 'SIGNED_OUT') {
        toast.success('Successfully signed out');
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed automatically');
      } else if (event === 'USER_UPDATED') {
        toast.success('Profile updated');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Session expiry warning
  useEffect(() => {
    if (!sessionExpiresAt) return;

    const checkExpiry = () => {
      const now = new Date();
      const timeUntilExpiry = sessionExpiresAt.getTime() - now.getTime();
      const minutesUntilExpiry = Math.floor(timeUntilExpiry / 1000 / 60);

      // Warn 5 minutes before expiry
      if (minutesUntilExpiry === 5) {
        toast('Session expires in 5 minutes', {
          icon: '⏰',
          duration: 5000,
        });
      }

      // Warn 1 minute before expiry
      if (minutesUntilExpiry === 1) {
        toast.error('Session expires in 1 minute!', {
          duration: 5000,
        });
      }
    };

    const interval = setInterval(checkExpiry, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [sessionExpiresAt]);

  // Validate that user profile exists in the database
  const validateUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

      if (error || !data) {
        console.error('User profile not found:', error);
        // Sign out user if profile doesn't exist
        await supabase.auth.signOut();
        throw new Error('User profile not found. Please contact support.');
      }

      return true;
    } catch (err) {
      console.error('Profile validation error:', err);
      throw err;
    }
  };

  const signUp = async (email, password, metadata = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) throw error;

    // Note: Profile is automatically created by database trigger (handle_new_user)
    // No need to manually insert here as it would violate RLS policies
    
    return data;
  };

  const signIn = async (email, password) => {
    // Validate inputs before sending to Supabase
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Supabase signIn error:', error);
        throw error;
      }

      // Validate user profile exists
      if (data.user) {
        try {
          await validateUserProfile(data.user.id);
        } catch (profileError) {
          // If profile doesn't exist, sign out and throw error
          await supabase.auth.signOut();
          throw profileError;
        }
      }

      return data;
    } catch (error) {
      // Log the full error for debugging
      if (import.meta.env.MODE !== 'production') {
        console.error('Full signIn error:', error);
      }
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const resetPassword = async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;
    return data;
  };

  const updatePassword = async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
    return data;
  };

  const updateProfile = async (updates) => {
    const { data, error } = await supabase.auth.updateUser({
      data: updates,
    });

    if (error) throw error;

    // Also update the profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        ...updates,
        updated_at: new Date().toISOString(),
      });

    if (profileError) throw profileError;

    return data;
  };

  const getSessionInfo = () => {
    if (!session || !sessionExpiresAt) return null;
    
    const now = new Date();
    const timeUntilExpiry = sessionExpiresAt.getTime() - now.getTime();
    const minutesUntilExpiry = Math.floor(timeUntilExpiry / 1000 / 60);
    const hoursUntilExpiry = Math.floor(minutesUntilExpiry / 60);
    
    return {
      expiresAt: sessionExpiresAt,
      minutesRemaining: minutesUntilExpiry,
      hoursRemaining: hoursUntilExpiry,
      isExpiringSoon: minutesUntilExpiry < 10,
    };
  };

  const value = {
    user,
    session,
    loading,
    sessionExpiresAt,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    getSessionInfo,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
