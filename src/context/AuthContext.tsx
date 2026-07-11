import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile, Role } from '../types';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, phone: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) {
      console.error('loadProfile error:', error.message);
      return;
    }
    if (data) setProfile(data as Profile);
  }

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session?.user) {
        loadProfile(data.session.user.id).finally(() => mounted && setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        (async () => { await loadProfile(newSession.user.id); })();
      } else {
        setProfile(null);
      }
    });

    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  async function ensureProfile(user: User, fullName: string, phone: string): Promise<Profile> {
    const { data: existing } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    if (existing) return existing as Profile;
    const { data, error } = await supabase
      .from('profiles')
      .insert({ id: user.id, full_name: fullName, phone, role: 'customer' as Role })
      .select('*')
      .single();
    if (error) throw error;
    return data as Profile;
  }

  async function signUp(email: string, password: string, fullName: string, phone: string) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, phone } },
      });
      if (error) return { error: error.message };
      if (data.user) {
        await ensureProfile(data.user, fullName, phone);
        await loadProfile(data.user.id);
      }
      return { error: null };
    } catch (e) {
      return { error: (e as Error).message };
    }
  }

  async function signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      if (data.user) await loadProfile(data.user.id);
      return { error: null };
    } catch (e) {
      return { error: (e as Error).message };
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
  }

  async function refreshProfile() {
    if (session?.user) await loadProfile(session.user.id);
  }

  return (
    <AuthContext.Provider value={{ user: session?.user ?? null, session, profile, loading, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
