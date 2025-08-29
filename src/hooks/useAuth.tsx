import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser } from '@supabase/supabase-js';

// Development mode flag
const DEV_MODE = import.meta.env.DEV;

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  reputationScore: number;
  totalLoans: number;
  successfulLoans: number;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  loginWithPhone: (phone: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    // In development, if we can't connect to Supabase quickly, skip auth
    if (DEV_MODE) {
      const quickCheck = setTimeout(() => {
        console.log('Quick auth check timeout - assuming no auth needed for dev');
        setLoading(false);
      }, 2000); // 2 second quick timeout for dev

      // Clear if we get a response
      const clearQuickCheck = () => clearTimeout(quickCheck);
      
      // Return early cleanup if we're in dev mode and timeout triggers
      const devModeReturn = () => {
        clearTimeout(quickCheck);
        clearTimeout(loadingTimeout);
      };
    }

    // Set a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      console.log('Auth loading timeout - setting loading to false');
      setLoading(false);
    }, 5000); // 5 second timeout

    // Listen for auth changes first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);
        clearTimeout(loadingTimeout);
        
        if (session?.user) {
          await fetchUserProfile(session.user);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    // Then get initial session
    const getInitialSession = async () => {
      try {
        console.log('Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        clearTimeout(loadingTimeout);
        
        if (error) {
          console.error('Error getting session:', error);
          setLoading(false);
          return;
        }
        
        if (session?.user) {
          console.log('Found session user:', session.user.id);
          await fetchUserProfile(session.user);
        } else {
          console.log('No session found');
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    return () => {
      subscription.unsubscribe();
      clearTimeout(loadingTimeout);
    };
  }, []);

  const fetchUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      console.log('Fetching user profile for:', supabaseUser.id);
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        // Create a basic user object from Supabase user if profile fetch fails
        setUser({
          id: supabaseUser.id,
          name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'Unknown User',
          email: supabaseUser.email || '',
          phone: supabaseUser.phone,
          reputationScore: 50,
          totalLoans: 0,
          successfulLoans: 0,
        });
        return;
      }

      if (profile) {
        setUser({
          id: profile.id,
          name: profile.name || 'Unknown User',
          email: profile.email || supabaseUser.email || '',
          phone: profile.phone,
          reputationScore: profile.reputation_score || 50,
          totalLoans: 0,
          successfulLoans: 0,
        });
      } else {
        // Profile doesn't exist, create one
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: supabaseUser.id,
            name: supabaseUser.user_metadata?.name || 'New User',
            email: supabaseUser.email,
            reputation_score: 50
          });

        if (!insertError) {
          setUser({
            id: supabaseUser.id,
            name: supabaseUser.user_metadata?.name || 'New User',
            email: supabaseUser.email || '',
            reputationScore: 50,
            totalLoans: 0,
            successfulLoans: 0,
          });
        }
      }    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Create a basic user object as fallback
      setUser({
        id: supabaseUser.id,
        name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
        email: supabaseUser.email || '',
        phone: supabaseUser.phone,
        reputationScore: 50,
        totalLoans: 0,
        successfulLoans: 0,
      });
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };  const signUp = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          },
          emailRedirectTo: `${window.location.origin}/`
        },
      });
      if (error) throw error;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const loginWithPhone = async (phone: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: phone,
        options: {
          channel: 'sms',
        }
      });
      if (error) throw error;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });
      if (error) throw error;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      signUp, 
      loginWithPhone, 
      loginWithGoogle, 
      logout, 
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
