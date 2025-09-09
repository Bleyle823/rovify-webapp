'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';

export default function AuthCallback() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handleAuthCallback = async () => {
            try {
                // Handle the OAuth callback
                const { data, error } = await supabase.auth.getSession();
                
                if (error) {
                    console.error('Auth callback error:', error);
                    setError(error.message);
                    return;
                }

                if (data.session) {
                    console.log('🔐 AUTH CALLBACK: Session established');
                    // Get redirect URL from search params or default to home
                    const redirectTo = searchParams.get('redirectTo') || '/home';
                    router.push(redirectTo);
                } else {
                    console.log('🔐 AUTH CALLBACK: No session found');
                    router.push('/auth/login?error=Authentication failed');
                }
            } catch (err) {
                console.error('Auth callback error:', err);
                setError('Authentication failed. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        handleAuthCallback();
    }, [router, searchParams]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Completing authentication...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="text-red-500 text-lg mb-4">Authentication Error</div>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={() => router.push('/auth/login')}
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="text-green-500 text-lg mb-4">Authentication Successful</div>
                <p className="text-gray-600">Redirecting...</p>
            </div>
        </div>
    );
}