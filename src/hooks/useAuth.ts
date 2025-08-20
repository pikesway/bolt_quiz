import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, getCurrentUser, signIn, signUp, signOut } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Get initial user
    getCurrentUser().then((user) => {
      setUser(user);
      setLoading(false);
    }).catch((error) => {
      console.error('Error getting current user:', error);
      setError(error);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        try {
          const currentUser = session?.user ?? null;
          setUser(currentUser);

          // If user is logged in but no profile exists, create one
          if (currentUser) {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select()
              .eq('id', currentUser.id)
              .single();

            if (profileError) {
              console.error('Error checking profile:', profileError);
            }

            if (!profile) {
              const { error: insertError } = await supabase.from('profiles').insert({
                id: currentUser.id,
                email: currentUser.email,
                full_name: currentUser.user_metadata.full_name || ''
              });

              if (insertError) {
                console.error('Error creating profile:', insertError);
              }
            }
          }

          setLoading(false);
        } catch (error) {
          console.error('Error in auth state change:', error);
          setError(error as Error);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleSignIn = async (email: string, password: string) => {
    try {
      const { data, error } = await signIn(email, password);
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error signing in:', error);
      return { data: null, error };
    }
  };

  const handleSignUp = async (email: string, password: string, fullName: string) => {
    try {
      const { data, error } = await signUp(email, password, fullName);
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error signing up:', error);
      return { data: null, error };
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Error signing out:', error);
      return { error };
    }
  };

  return {
    user,
    loading,
    error,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut
  };
}