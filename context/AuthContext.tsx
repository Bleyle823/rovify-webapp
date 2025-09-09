/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { createContext, useContext, useState, useEffect, ReactNode, JSX } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase, authHelpers } from '@/lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

// Updated User interface based on Supabase auth + our custom fields
interface User {
    id: string;
    email?: string;
    name?: string;
    image?: string;
    walletAddress?: string;
    baseName?: string;
    ethName?: string;
    authMethod?: 'email' | 'google' | 'metamask' | 'base';
    role?: 'admin' | 'organiser' | 'attendee';
    verified?: boolean;
    [key: string]: unknown;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    loginWithProvider: (provider: 'google' | 'github') => Promise<void>;
    loginWithWallet: (userData: User) => Promise<void>;
    logout: () => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper for public paths - keep this in sync with router configuration
function isPublicPath(pathname: string): boolean {
    return pathname === '/' ||
        pathname.startsWith('/auth/') ||
        pathname.startsWith('/forbidden/') ||
        pathname.startsWith('/maintenance/') ||
        pathname.startsWith('/terms') ||
        pathname.startsWith('/privacy') ||
        pathname.startsWith('/help') ||
        pathname.startsWith('/api/');
}

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [authInitialized, setAuthInitialized] = useState<boolean>(false);
    const router = useRouter();
    const pathname = usePathname();

    // Initialize auth state from Supabase
    useEffect(() => {
        console.log('🔐 AUTH: Initializing Supabase auth state');

        const initAuth = async () => {
            try {
                // Check if we're in demo mode (when Supabase is not configured)
                const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true' || 
                              !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                              process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co';

                if (isDemo) {
                    console.log('🔐 AUTH: Running in demo mode - Supabase not configured');
                    setUser(null);
                    setIsAuthenticated(false);
                    setIsLoading(false);
                    return;
                }

                // Get current session
                const { data: { session } } = await supabase.auth.getSession();
                
                if (session?.user) {
                    console.log('🔐 AUTH: Found existing session');
                    await setupUserFromSession(session.user);
                } else {
                    console.log('🔐 AUTH: No existing session');
                    setUser(null);
                    setIsAuthenticated(false);
                }
            } catch (error) {
                console.error('🔐 AUTH ERROR: Session check failed', error);
                setUser(null);
                setIsAuthenticated(false);
            } finally {
                setIsLoading(false);
                setAuthInitialized(true);
            }
        };

        initAuth();

        // Listen for auth changes with debouncing
        let authChangeTimeout: NodeJS.Timeout;
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('🔐 AUTH: Auth state changed:', event);
            
            // Clear previous timeout to debounce rapid auth changes
            if (authChangeTimeout) {
                clearTimeout(authChangeTimeout);
            }
            
            authChangeTimeout = setTimeout(async () => {
                if (event === 'SIGNED_IN' && session?.user) {
                    await setupUserFromSession(session.user);
                } else if (event === 'SIGNED_OUT') {
                    setUser(null);
                    setIsAuthenticated(false);
                }
            }, 50); // 50ms debounce
        });

        return () => {
            if (authChangeTimeout) {
                clearTimeout(authChangeTimeout);
            }
            subscription.unsubscribe();
        };
    }, []);

    // Setup user from Supabase session
    const setupUserFromSession = async (supabaseUser: SupabaseUser) => {
        try {
            console.log('🔐 AUTH: Setting up user from session', supabaseUser.email);
            
            // Get user profile from our users table with optimized query
            const { data: profile, error } = await supabase
                .from('users')
                .select('id, email, name, image, auth_method, is_organiser, is_admin, verified, wallet_address, base_name, ens_name')
                .eq('id', supabaseUser.id)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
                console.error('🔐 AUTH ERROR: Failed to fetch user profile', error);
                throw error;
            }

            // Create user object combining Supabase auth and our profile data
            const userData: User = {
                id: supabaseUser.id,
                email: supabaseUser.email || undefined,
                name: profile?.name || supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || undefined,
                image: profile?.image || supabaseUser.user_metadata?.avatar_url || supabaseUser.user_metadata?.picture || undefined,
                authMethod: (supabaseUser.app_metadata?.provider === 'google' ? 'google' : 'email') as 'email' | 'google' | 'metamask' | 'base',
                role: profile?.is_admin ? 'admin' : (profile?.is_organiser ? 'organiser' : 'attendee'),
                verified: profile?.verified || (supabaseUser.email_confirmed_at ? true : false),
                walletAddress: profile?.wallet_address || undefined,
                baseName: profile?.base_name || undefined,
                ethName: profile?.ens_name || undefined
            };

            // If no profile exists, create one efficiently
            if (!profile) {
                console.log('🔐 AUTH: Creating new user profile via API');
                const resp = await fetch('/api/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: supabaseUser.id,
                        email: supabaseUser.email,
                        name: userData.name,
                        image: userData.image,
                        auth_method: userData.authMethod,
                    })
                });

                if (!resp.ok) {
                    const err = await resp.json().catch(() => ({}));
                    console.error('🔐 AUTH ERROR: Failed to create user profile (API)', err);
                    throw new Error(err?.error || 'Failed to create user profile');
                }

                console.log('🔐 AUTH: User profile created successfully (API)');
            }

            setUser(userData);
            setIsAuthenticated(true);
            console.log('🔐 AUTH: User authenticated', userData.email);
        } catch (error) {
            console.error('🔐 AUTH ERROR: Failed to setup user from session', error);
            setUser(null);
            setIsAuthenticated(false);
        }
    };

    // Handle routing based on auth status
    useEffect(() => {
        if (isLoading) return;

        const authPaths = ['/auth/login', '/auth/register', '/auth/forgot-password'];
        const isAuthPath = authPaths.includes(pathname);

        console.log(`🔐 AUTH: Navigation check - Path: ${pathname}, Auth path: ${isAuthPath}, User: ${isAuthenticated ? 'Logged in' : 'Not logged in'}`);

        if (!isAuthenticated && !isAuthPath && !isPublicPath(pathname)) {
            console.log('🔐 AUTH: Redirecting unauthenticated user to login from', pathname);
            router.push('/auth/login');
        } else if (isAuthenticated && isAuthPath) {
            console.log('🔐 AUTH: Redirecting authenticated user');
            router.push('/home');
        }
    }, [isAuthenticated, isLoading, pathname, router]);

    // Email/password login
    const login = async (email: string, password: string): Promise<void> => {
        console.log('🔐 AUTH: Login attempt for', email);
        setIsLoading(true);

        try {
            // Check if we're in demo mode
            const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true' || 
                          !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                          process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co';

            if (isDemo) {
                console.log('🔐 AUTH: Demo mode login');
                // Create a demo user
                const demoUser: User = {
                    id: 'demo-user-' + Date.now(),
                email: email,
                    name: 'Demo User',
                authMethod: 'email',
                    role: 'attendee',
                    verified: true
                };
                
                setUser(demoUser);
                setIsAuthenticated(true);
                console.log('🔐 AUTH: Demo login successful');
                router.push('/home');
                return;
            }

            const { data, error } = await authHelpers.signIn(email, password);
            
            if (error) {
                throw new Error(error.message);
            }

            // Ensure middleware sees the session by setting server auth cookies
            try {
                const access_token = data?.session?.access_token;
                const refresh_token = data?.session?.refresh_token;
                if (access_token && refresh_token) {
                    await fetch('/api/auth/set-session', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ access_token, refresh_token })
                    });
                }
            } catch (e) {
                console.warn('Auth cookie sync warning:', e);
            }

            console.log('🔐 AUTH: Login successful');
            
            // Optimized: Don't wait for onAuthStateChange, redirect immediately
            // The auth state will be updated in the background
            setTimeout(() => {
                router.push('/home');
            }, 100); // Small delay to ensure state updates
        } catch (error) {
            console.error('🔐 AUTH ERROR: Login failed', error);
            throw new Error(error instanceof Error ? error.message : 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    // OAuth provider login
    const loginWithProvider = async (provider: 'google' | 'github'): Promise<void> => {
        console.log('🔐 AUTH: OAuth login attempt with', provider);
        setIsLoading(true);

        try {
            const { data, error } = await authHelpers.signInWithProvider(provider);
            
            if (error) {
                // Provide specific error message for provider not enabled
                if (error.message.includes('provider is not enabled')) {
                    throw new Error(`${provider.charAt(0).toUpperCase() + provider.slice(1)} OAuth is not enabled in Supabase. Please enable it in your Supabase dashboard under Authentication → Providers.`);
                }
                throw new Error(error.message);
            }

            console.log('🔐 AUTH: OAuth login initiated');
            // Redirect will happen automatically
        } catch (error) {
            console.error('🔐 AUTH ERROR: OAuth login failed', error);
            throw new Error(error instanceof Error ? error.message : 'OAuth login failed');
        } finally {
            setIsLoading(false);
        }
    };

    // Wallet-based login (for Web3 authentication)
    const loginWithWallet = async (userData: User): Promise<void> => {
        console.log(`🔐 AUTH: Wallet login attempt for ${userData.walletAddress || 'unknown wallet'}`);
        setIsLoading(true);

        try {
            // For wallet auth, we'll create a user record directly
            // In a production app, you'd want to verify wallet signature here
            
            if (!userData.walletAddress) {
                throw new Error('Wallet address is required');
            }

            // Check if user exists with this wallet
            const { data: existingUser } = await supabase
                .from('users')
                .select('*')
                .eq('wallet_address', userData.walletAddress)
                .single();

            if (existingUser) {
                // User exists, update their info
                const userObj: User = {
                    ...existingUser,
                    email: existingUser.email || undefined,
                    name: existingUser.name || undefined,
                    image: existingUser.image || undefined,
                    walletAddress: existingUser.wallet_address || undefined,
                    authMethod: 'metamask' as 'email' | 'google' | 'metamask' | 'base'
                };
                setUser(userObj);
                setIsAuthenticated(true);
            } else {
                // Create new user
                const { data: newUser, error } = await supabase
                    .from('users')
                    .insert({
                        wallet_address: userData.walletAddress,
                        name: userData.name || userData.baseName || userData.ethName || undefined,
                        auth_method: 'metamask',
                        is_organiser: false,
                        is_admin: false,
                        created_at: new Date().toISOString()
                    })
                    .select()
                    .single();

                if (error) throw error;

                const userObj: User = {
                    ...newUser,
                    email: newUser.email || undefined,
                    name: newUser.name || undefined,
                    image: newUser.image || undefined,
                    walletAddress: newUser.wallet_address || undefined,
                    authMethod: 'metamask' as 'email' | 'google' | 'metamask' | 'base'
                };
                setUser(userObj);
            setIsAuthenticated(true);
            }

            console.log('🔐 AUTH: Wallet login successful');
            router.push('/home');
        } catch (error) {
            console.error('🔐 AUTH ERROR: Wallet login failed', error);
            throw new Error('Wallet authentication failed');
        } finally {
            setIsLoading(false);
        }
    };

    // User registration
    const register = async (name: string, email: string, password: string): Promise<void> => {
        console.log('🔐 AUTH: Register attempt for', email);
        setIsLoading(true);

        try {
            const { data, error } = await authHelpers.signUp(email, password, {
                full_name: name
            });
            
            if (error) {
                throw new Error(error.message);
            }

            console.log('🔐 AUTH: Registration successful', data);
            
            // Check if user is immediately signed in (email confirmation disabled)
            if (data.user && data.session) {
                console.log('🔐 AUTH: User automatically signed in after registration');
                // User is signed in immediately, redirect to home
                setTimeout(() => {
                    router.push('/home');
                }, 100);
            } else if (data.user && !data.session) {
                console.log('🔐 AUTH: Email confirmation required for user:', data.user.email);
                // Email confirmation is required, but provide better UX
                router.push('/auth/login?message=Registration successful! Please check your email to verify your account and then log in.');
            } else {
                console.log('🔐 AUTH: Registration completed, redirecting to login');
                // Fallback case
                router.push('/auth/login?message=Registration successful! Please log in to continue.');
            }
        } catch (error) {
            console.error('🔐 AUTH ERROR: Registration failed', error);
            throw new Error(error instanceof Error ? error.message : 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    // Logout
    const logout = async (): Promise<void> => {
        console.log('🔐 AUTH: Logging out user', user?.email || user?.walletAddress || user?.id);

        try {
            await authHelpers.signOut();
            // User state will be updated automatically via onAuthStateChange
            console.log('🔐 AUTH: User logged out');
            router.push('/auth/login');
        } catch (error) {
            console.error('🔐 AUTH ERROR: Logout failed', error);
            // Force logout locally even if server logout fails
        setUser(null);
        setIsAuthenticated(false);
        router.push('/auth/login');
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            isLoading,
            isAuthenticated,
            login,
            loginWithProvider,
            loginWithWallet,
            logout,
            register
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}