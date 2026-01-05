import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const AuthContext = createContext({});

// eslint-disable-next-line react-refresh/only-export-components
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

  // Define validateUserProfile with useCallback to prevent dependency changes
  const validateUserProfile = useCallback(async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

      if (error || !data) {
        if (import.meta.env.MODE !== 'production') {
          console.error('User profile not found:', error);
        }
        throw new Error('User profile not found. Please contact support.');
      }

      return true;
    } catch (err) {
      if (import.meta.env.MODE !== 'production') {
        console.error('Profile validation error:', err);
      }
      throw err;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Add timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      if (isMounted && import.meta.env.MODE !== 'production') {
        console.warn('[Auth] Session load timeout - setting loading to false');
      }
      if (isMounted) {
        setLoading(false);
      }
    }, 15000); // 15 second timeout

    // Robust session recovery with multiple fallback layers
    const recoverSession = async () => {
      try {
        if (import.meta.env.MODE !== 'production') {
          console.log('[Auth] Starting session recovery...');
        }

        // Layer 1: Try to get existing session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('[Auth] getSession error:', sessionError);

          // Layer 2: Try to refresh the session
          if (import.meta.env.MODE !== 'production') {
            console.log('[Auth] Attempting session refresh...');
          }

          const { data: { session: refreshedSession }, error: refreshError } =
            await supabase.auth.refreshSession();

          if (refreshError) {
            console.error('[Auth] refreshSession error:', refreshError);

            // Layer 3: Try to get user directly
            if (import.meta.env.MODE !== 'production') {
              console.log('[Auth] Attempting to get user...');
            }

            const { data: { user }, error: userError } = await supabase.auth.getUser();

            if (userError || !user) {
              console.error('[Auth] getUser error:', userError);
              // All recovery attempts failed - clear state
              if (isMounted) {
                setSession(null);
                setUser(null);
                setSessionExpiresAt(null);
              }
              return;
            }

            // User exists but no session - this shouldn't happen
            console.warn('[Auth] User exists but no session - clearing corrupted state');
            if (isMounted) {
              setSession(null);
              setUser(null);
              setSessionExpiresAt(null);
            }
            return;
          }

          // Refresh succeeded
          if (refreshedSession && isMounted) {
            if (import.meta.env.MODE !== 'production') {
              console.log('[Auth] Session refreshed successfully');
            }
            setSession(refreshedSession);
            setUser(refreshedSession.user);
            setSessionExpiresAt(refreshedSession.expires_at ?
              new Date(refreshedSession.expires_at * 1000) : null);
          }
          return;
        }

        // Layer 1 succeeded - we have a session
        if (session?.user && isMounted) {
          if (import.meta.env.MODE !== 'production') {
            console.log('[Auth] Session recovered from storage');
          }
          setSession(session);
          setUser(session.user);
          setSessionExpiresAt(session.expires_at ?
            new Date(session.expires_at * 1000) : null);
        } else if (isMounted) {
          // No session found - user is logged out
          if (import.meta.env.MODE !== 'production') {
            console.log('[Auth] No session found - user logged out');
          }
          setSession(null);
          setUser(null);
          setSessionExpiresAt(null);
        }
      } catch (error) {
        // Catch any unexpected errors
        console.error('[Auth] Unexpected error during session recovery:', error);
        if (isMounted) {
          setSession(null);
          setUser(null);
          setSessionExpiresAt(null);
        }
      } finally {
        // Clear timeout and ALWAYS set loading to false
        clearTimeout(loadingTimeout);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Start recovery
    recoverSession();

    // Cleanup
    return () => {
      isMounted = false;
      clearTimeout(loadingTimeout);
    };

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Only log in development
      if (import.meta.env.MODE !== 'production') {
        console.log('Auth state changed:', event);
      }

      // Validate profile ONLY on initial sign in, NOT on token refresh
      // Token refresh should be seamless and not trigger validation
      if (session?.user && event === 'SIGNED_IN') {
        try {
          await validateUserProfile(session.user.id);
          setSession(session);
          setUser(session.user);
          setSessionExpiresAt(session.expires_at ? new Date(session.expires_at * 1000) : null);
        } catch (error) {
          console.error('Profile validation failed:', error);

          // PRODUCTION: Block login if profile is missing or deleted
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setSessionExpiresAt(null);

          toast.error('Your account is no longer active. Please contact support.', {
            duration: 5000,
          });

          return;
        }
      } else {
        setSession(session);
        setUser(session?.user ?? null);
        setSessionExpiresAt(session?.expires_at ? new Date(session.expires_at * 1000) : null);
      }

      // Show notifications for auth events BEFORE setting loading false
      // This ensures user sees feedback immediately
      if (event === 'SIGNED_IN') {
        toast.success('Successfully signed in!');
      } else if (event === 'SIGNED_OUT') {
        toast.success('Successfully signed out');
      } else if (event === 'TOKEN_REFRESHED') {
        if (import.meta.env.MODE !== 'production') {
          console.log('Token refreshed automatically', {
            hasSession: !!session,
            hasUser: !!session?.user,
            expiresAt: session?.expires_at
          });
        }
      } else if (event === 'USER_UPDATED') {
        toast.success('Profile updated');
      }

      // Set loading false AFTER all state updates and notifications
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [validateUserProfile]);

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
  }, [sessionExpiresAt, validateUserProfile]);

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
        if (import.meta.env.MODE !== 'production') {
          console.error('[Auth] signIn error:', error);
        }
        throw error;
      }

      // Profile validation is handled by the onAuthStateChange listener
      // No need to validate here to avoid duplicate validation and delays
      if (import.meta.env.MODE !== 'production') {
        console.log('[Auth] signIn successful, waiting for auth state change');
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
    try {
      if (import.meta.env.MODE !== 'production') {
        console.log('[Auth] Signing out...');
      }

      const { error } = await supabase.auth.signOut();

      // If error is "session missing", that's okay - clear local state anyway
      if (error && !error.message?.includes('session missing')) {
        console.error('[Auth] SignOut error:', error);
        // Don't throw - continue with cleanup
      }

      // Clear local state
      setUser(null);
      setSession(null);
      setSessionExpiresAt(null);

      // Thoroughly clear ALL Supabase auth data from localStorage
      try {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (
            key.startsWith('sb-') ||
            key.includes('supabase') ||
            key.includes('auth-token')
          )) {
            keysToRemove.push(key);
          }
        }

        keysToRemove.forEach(key => {
          localStorage.removeItem(key);
          if (import.meta.env.MODE !== 'production') {
            console.log(`[Auth] Cleared localStorage key: ${key}`);
          }
        });

        if (import.meta.env.MODE !== 'production') {
          console.log(`[Auth] Cleared ${keysToRemove.length} auth keys from localStorage`);
        }
      } catch (storageError) {
        console.error('[Auth] Error clearing localStorage:', storageError);
      }

    } catch (error) {
      // Even if logout fails, clear local state
      console.error('[Auth] Unexpected logout error:', error);
      setUser(null);
      setSession(null);
      setSessionExpiresAt(null);

      // Don't throw - allow logout to complete
    }
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
