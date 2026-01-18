import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { User } from '@/types';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    initialize: () => Promise<void>;
    setUser: (user: User | null) => void;
    logout: () => Promise<void>;
}

const mapSupabaseUser = (sbUser: any): User | null => {
    if (!sbUser) return null;
    const { id, email, created_at, user_metadata } = sbUser;
    return {
        id,
        email: email || '',
        name: user_metadata?.name || email?.split('@')[0] || 'User',
        avatar_url: user_metadata?.avatar_url,
        // Force admin role for specific email, otherwise trust metadata
        role: email === 'admin@tech.com' ? 'admin' : (user_metadata?.role || 'student'),
        created_at,
    };
};

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,

    initialize: async () => {
        try {
            // Get initial session
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user) {
                set({
                    user: mapSupabaseUser(session.user),
                    isAuthenticated: true,
                    isLoading: false
                });
            } else {
                set({ user: null, isAuthenticated: false, isLoading: false });
            }

            // Listen for auth changes
            supabase.auth.onAuthStateChange(async (_event, session) => {
                const user = session?.user ? mapSupabaseUser(session.user) : null;
                set({
                    user,
                    isAuthenticated: !!user,
                    isLoading: false
                });
            });
        } catch (error) {
            console.error('Auth initialization error:', error);
            set({ isLoading: false });
        }
    },

    setUser: (user) => set({ user, isAuthenticated: !!user }),

    logout: async () => {
        await supabase.auth.signOut();
        set({ user: null, isAuthenticated: false });
    },
}));

