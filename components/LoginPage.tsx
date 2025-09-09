/* eslint-disable @typescript-eslint/no-unused-vars */

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight, FiUser, FiCalendar, FiTrendingUp, FiUsers, FiZap, FiStar, FiHeart, FiCheck } from 'react-icons/fi';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useBaseAuth } from '@/hooks/useBaseAuth';
import RoviLogo from '@/public/images/contents/rovi-logo.png';
import GoogleIcon from '@/public/images/icons/google-logo.svg';
import BaseIcon from '@/public/images/icons/base-logo.png';
import MetaMaskIcon from '@/public/images/icons/metamask-logo.svg';
import { getOAuthRedirectUri } from '@/utils/env';

const DEMO_CREDENTIALS = {
    admin: {
        email: 'admin@rovify.io',
        password: 'demo123',
        userData: {
            id: 'adm-demo-001',
            email: 'admin@rovify.io',
            name: 'Marcus Chen',
            image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
            authMethod: 'email' as const,
            role: 'admin',
            company: 'Rovify',
        }
    },
    organiser: {
        email: 'organiser@rovify.io',
        password: 'demo123',
        userData: {
            id: 'org-demo-001',
            email: 'organiser@rovify.io',
            name: 'Sarah Johnson',
            image: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face',
            authMethod: 'email' as const,
            role: 'organiser',
            company: 'EventCorp',
        }
    },
    attendee: {
        email: 'attendee@rovify.io',
        password: 'demo123',
        userData: {
            id: 'att-demo-001',
            email: 'attendee@rovify.io',
            name: 'Alex Rivera',
            image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
            authMethod: 'email' as const,
            role: 'attendee',
            company: 'TechStartup Inc',
        }
    }
};

const EVENT_IMAGES = [
    {
        src: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=600&fit=crop',
        alt: 'Vibrant concert crowd',
        title: 'Unforgettable Experiences'
    },
    {
        src: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&h=600&fit=crop',
        alt: 'Conference networking',
        title: 'Professional Networking'
    },
    {
        src: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&h=600&fit=crop',
        alt: 'Corporate event celebration',
        title: 'Corporate Excellence'
    },
    {
        src: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&h=600&fit=crop',
        alt: 'Festival celebration',
        title: 'Community Celebrations'
    }
];

const DYNAMIC_MESSAGES = [
    {
        title: "WHERE MOMENTS",
        subtitle: "BEGIN",
        description: "Create unforgettable experiences that connect creators with their communities worldwide."
    },
    {
        title: "STREAM IT!",
        subtitle: "FLEX IT! OWN IT!",
        description: "Revolutionary NFT ticketing and creator marketplace built for the Web3 generation."
    },
    {
        title: "CREATORS FIRST,",
        subtitle: "ALWAYS",
        description: "Direct monetization, global reach, and community building tools in one platform."
    },
    {
        title: "BUILD YOUR",
        subtitle: "EMPIRE",
        description: "Social-first event platform with loyalty systems and creator incentive programs."
    }
];

// 3D Glassmorphism Emoji Components
const GlassEmoji = ({ type, size = "w-8 h-8" }: { type: string; size?: string }) => {
    const emojiStyles = {
        artist: {
            bg: "bg-gradient-to-br from-purple-400 via-pink-400 to-red-400",
            icon: "🎨",
            glow: "shadow-purple-500/30"
        },
        money: {
            bg: "bg-gradient-to-br from-yellow-400 via-amber-400 to-orange-400",
            icon: "💰",
            glow: "shadow-yellow-500/30"
        },
        chart: {
            bg: "bg-gradient-to-br from-green-400 via-emerald-400 to-teal-400",
            icon: "📈",
            glow: "shadow-green-500/30"
        },
        ticket: {
            bg: "bg-gradient-to-br from-blue-400 via-indigo-400 to-purple-400",
            icon: "🎫",
            glow: "shadow-blue-500/30"
        },
        shop: {
            bg: "bg-gradient-to-br from-pink-400 via-rose-400 to-red-400",
            icon: "🛍️",
            glow: "shadow-pink-500/30"
        },
        phone: {
            bg: "bg-gradient-to-br from-cyan-400 via-blue-400 to-indigo-400",
            icon: "📱",
            glow: "shadow-cyan-500/30"
        }
    };

    const style = emojiStyles[type as keyof typeof emojiStyles];

    return (
        <div className={`${size} relative group cursor-pointer`}>
            {/* Outer Glow */}
            <div className={`absolute inset-0 ${style.bg} rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity duration-300 ${style.glow} shadow-2xl animate-glass-breathe`}></div>

            {/* Main Glass Container */}
            <div className={`relative ${size} ${style.bg} rounded-2xl backdrop-blur-xl border border-white/30 shadow-2xl overflow-hidden group-hover:scale-110 transition-all duration-300 animate-glass-glow`}>
                {/* Top Glass Shine */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/10 to-transparent rounded-2xl"></div>

                {/* Inner Glow */}
                <div className="absolute inset-0 bg-gradient-to-t from-white/20 via-transparent to-white/30 rounded-2xl"></div>

                {/* Emoji Content */}
                <div className="relative z-10 w-full h-full flex items-center justify-center text-lg font-bold text-white drop-shadow-lg">
                    <span className="filter drop-shadow-md">{style.icon}</span>
                </div>

                {/* Bottom Shine */}
                <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-white/20 to-transparent rounded-b-2xl"></div>

                {/* Side Reflection */}
                <div className="absolute top-2 left-2 w-1 h-4 bg-white/50 rounded-full blur-sm"></div>
            </div>
        </div>
    );
};

const CREATOR_STATS = [
    { label: "Event Creators", value: "50K+", icon: "artist" },
    { label: "Market Size", value: "$700B+", icon: "money" },
    { label: "Growth Rate", value: "22.7%", icon: "chart" }
];

const WEB3_FEATURES = [
    {
        icon: "ticket",
        title: 'NFT Ticketing Ready',
        description: 'Secure, tradeable event access'
    },
    {
        icon: "shop",
        title: 'Creator Marketplace',
        description: 'Direct monetization & merch sales'
    },
    {
        icon: "phone",
        title: 'Social-First Design',
        description: 'Built for Gen Z & creators'
    }
];

// Floating Particle Component
const FloatingParticle = ({ delay = 0 }) => {
    return (
        <motion.div
            className="absolute w-2 h-2 bg-white/20 rounded-full"
            initial={{
                x: Math.random() * 400,
                y: Math.random() * 600,
                scale: Math.random() * 0.5 + 0.5
            }}
            animate={{
                x: Math.random() * 400,
                y: Math.random() * 600,
                scale: [0.5, 1, 0.5],
                opacity: [0.2, 0.8, 0.2]
            }}
            transition={{
                duration: Math.random() * 10 + 15,
                repeat: Infinity,
                delay: delay,
                ease: "linear"
            }}
        />
    );
};

// Generate a secure random string
const generateRandomString = (length = 32): string => {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Hash string (for PKCE code challenge)
const sha256 = async (plain: string): Promise<ArrayBuffer> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    return await window.crypto.subtle.digest('SHA-256', data);
};

// Base64 URL encode from ArrayBuffer
const base64UrlEncode = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    const binString = Array.from(bytes).map(byte => String.fromCharCode(byte)).join('');
    return btoa(binString)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
};

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login, loginWithProvider, isAuthenticated } = useAuth();
    const { authenticateWithBase, isLoading: isBaseLoading, error: baseError } = useBaseAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false);
    const [walletAvailable, setWalletAvailable] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Image carousel state
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

    // Easter egg state
    const [logoClickCount, setLogoClickCount] = useState(0);
    const [showSecretPanel, setShowSecretPanel] = useState(false);
    const [secretSequence, setSecretSequence] = useState<string[]>([]);

    // If authenticated, ensure we leave auth pages immediately
    useEffect(() => {
        if (isAuthenticated) {
            router.replace('/home');
        }
    }, [isAuthenticated, router]);

    // Fallback: when success overlay shows, force redirect shortly after
    useEffect(() => {
        if (showSuccess) {
            const t = setTimeout(() => router.replace('/home'), 300);
            return () => clearTimeout(t);
        }
    }, [showSuccess, router]);

    // Store auth challenge state
    const [metaMaskChallenge, setMetaMaskChallenge] = useState('');
    const [oauthState, setOauthState] = useState('');
    const [pkceVerifier, setPkceVerifier] = useState('');

    // Image and message rotation effect
    useEffect(() => {
        const imageInterval = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % EVENT_IMAGES.length);
        }, 4000);

        const messageInterval = setInterval(() => {
            setCurrentMessageIndex((prev) => (prev + 1) % DYNAMIC_MESSAGES.length);
        }, 5000);

        return () => {
            clearInterval(imageInterval);
            clearInterval(messageInterval);
        };
    }, []);

    // Auto-focus email field
    useEffect(() => {
        const emailInput = document.getElementById('email');
        if (emailInput) {
            emailInput.focus();
        }
    }, []);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            // Enter to submit
            if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.altKey) {
                const form = document.querySelector('form');
                if (form && document.activeElement?.tagName !== 'BUTTON') {
                    e.preventDefault();
                    form.requestSubmit();
                }
            }

            // Escape to clear
            if (e.key === 'Escape') {
                setError('');
                setShowSecretPanel(false);
            }

            // Secret sequence detection
            const key = e.key?.toLowerCase() || '';
            if (key) {
                const newSequence = [...secretSequence, key];
                if (newSequence.length > 10) newSequence.shift();
                setSecretSequence(newSequence);

                if (newSequence.join('').includes('demo')) {
                    setShowSecretPanel(true);
                    setSecretSequence([]);
                    setTimeout(() => setShowSecretPanel(false), 10000);
                }
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [secretSequence]);

    // OAuth callback handler
    const handleOAuthCallback = useCallback(async (code: string, stateParam: string) => {
        console.log('Processing OAuth callback...');
        setIsLoading(true);
        try {
            const savedState = localStorage.getItem('oauth_state');
            console.log('Verifying OAuth state parameter...');

            if (stateParam !== savedState) {
                console.error('OAuth state mismatch', { received: stateParam, saved: savedState });
                throw new Error('Invalid authentication state');
            }

            console.log('OAuth state verified successfully');
            const verifier = localStorage.getItem('pkce_verifier');
            console.log('Retrieved PKCE verifier');

            if (!verifier) {
                console.error('PKCE verifier missing');
                throw new Error('PKCE verifier missing');
            }

            console.log('Exchanging authorization code for tokens...');
            const redirectUri = getOAuthRedirectUri('google');

            const response = await fetch('/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code,
                    codeVerifier: verifier,
                    redirectUri: redirectUri
                })
            });

            localStorage.removeItem('oauth_state');
            localStorage.removeItem('pkce_verifier');
            console.log('Cleared OAuth session data from localStorage');

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Token exchange failed:', errorData);
                throw new Error(errorData.message || 'Failed to authenticate with Google');
            }

            const userData = await response.json();
            console.log('User profile retrieved:', {
                id: userData.id,
                email: userData.email,
                name: userData.name
            });

            setShowSuccess(true);
            setTimeout(() => {
                console.log('Google authentication successful, redirecting to home');
                window.history.replaceState({}, document.title, window.location.pathname);
                router.push('/home');
            }, 1500);
        } catch (error) {
            console.error('OAuth callback error:', error);
            setError(error instanceof Error ? error.message : 'Authentication failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [login, router]);

    // Initialize auth and easter egg detection
    useEffect(() => {
        const initAuth = () => {
            console.log('Initializing login page...');

            if (typeof window !== 'undefined') {
                const hasWallet = !!window.ethereum;
                setWalletAvailable(hasWallet);
                console.log('Wallet available:', hasWallet);

                const hasMetaMask = !!window.ethereum?.isMetaMask;
                setIsMetaMaskInstalled(hasMetaMask);
                console.log('MetaMask available:', hasMetaMask);

                const challenge = generateRandomString();
                setMetaMaskChallenge(challenge);
                console.log('Generated MetaMask challenge');

                const oauthStateValue = generateRandomString();
                setOauthState(oauthStateValue);
                console.log('Generated OAuth state parameter');

                const verifier = generateRandomString(64);
                setPkceVerifier(verifier);
                console.log('Generated PKCE verifier');

                const code = searchParams?.get('code');
                const stateParam = searchParams?.get('state');

                if (code && stateParam) {
                    console.log('OAuth callback parameters detected');
                    handleOAuthCallback(code, stateParam);
                }
            }
        };

        initAuth();
    }, [searchParams, handleOAuthCallback]);

    // Handle logo click easter egg
    const handleLogoClick = () => {
        const newCount = logoClickCount + 1;
        setLogoClickCount(newCount);

        if (newCount === 7) {
            setShowSecretPanel(true);
            setLogoClickCount(0);
            setTimeout(() => setShowSecretPanel(false), 10000);
        }

        setTimeout(() => setLogoClickCount(0), 3000);
    };

    // Handle demo credential login
    const handleDemoLogin = (credType: 'admin' | 'organiser' | 'attendee') => {
        const cred = DEMO_CREDENTIALS[credType];
        setEmail(cred.email);
        setPassword(cred.password);
        setShowSecretPanel(false);
    };

    // Handle email/password login
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('🔐 LOGIN: Form submitted with email:', email);

        if (!email || !password) {
            setError('Please enter both email and password');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            await login(email, password);
            setShowSuccess(true);
            console.log('🔐 LOGIN: Login successful');
        } catch (error) {
            console.error('🔐 LOGIN ERROR:', error);
            setError(error instanceof Error ? error.message : 'Invalid email or password. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle Google login
    const handleGoogleLogin = async () => {
        try {
            console.log('🔐 LOGIN: Starting Google OAuth...');
            setIsLoading(true);
            
            await loginWithProvider('google');
        } catch (error) {
            console.error('🔐 LOGIN ERROR: Google OAuth failed:', error);
            setError(error instanceof Error ? error.message : 'Google authentication failed');
            setIsLoading(false);
        }
    };

    // Handle Base login
    const handleBaseLogin = async () => {
        try {
            const result = await authenticateWithBase('/home');
            if (!result.success && baseError) {
                setError(baseError);
            }
        } catch (error) {
            console.error('Base authentication error:', error);
            setError(error instanceof Error ? error.message : 'Failed to authenticate with Base');
        }
    };

    return (
        <div className="min-h-screen w-full flex relative overflow-hidden bg-white">
            {/* Success Animation Overlay */}
            <AnimatePresence>
                {showSuccess && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-[#FF5900]/90 backdrop-blur-lg"
                    >
                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", duration: 0.8, bounce: 0.4 }}
                            className="relative"
                        >
                            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.3, type: "spring", bounce: 0.6 }}
                                >
                                    <FiCheck className="w-12 h-12 text-[#FF5900]" strokeWidth={3} />
                                </motion.div>
                            </div>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-white text-center"
                            >
                                <div className="text-xl font-bold">Welcome to Rovify!</div>
                                <div className="text-sm opacity-90">Redirecting you now...</div>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Left Column - ENERGIZED with Floating Particles & Dynamic Content */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-[#FF5900] via-[#FF6B1A] to-[#FF8A4D] overflow-hidden rounded-tr-3xl rounded-bl-3xl my-8 mx-4">
                {/* Floating Particles */}
                <div className="absolute inset-0 overflow-hidden">
                    {Array.from({ length: 20 }).map((_, i) => (
                        <FloatingParticle key={i} delay={i * 0.5} />
                    ))}
                </div>

                {/* Enhanced Background with Parallax Effect */}
                <div className="absolute inset-0">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentImageIndex}
                            initial={{ opacity: 0, scale: 1.2, rotateY: 15 }}
                            animate={{ opacity: 0.4, scale: 1, rotateY: 0 }}
                            exit={{ opacity: 0, scale: 0.9, rotateY: -15 }}
                            transition={{ duration: 2, ease: "easeOut" }}
                            className="absolute inset-0"
                        >
                            <Image
                                src={EVENT_IMAGES[currentImageIndex].src}
                                alt={EVENT_IMAGES[currentImageIndex].alt}
                                fill
                                className="object-cover"
                                style={{
                                    filter: 'blur(3px) brightness(0.3) contrast(1.2) saturate(1.1)',
                                    transform: 'scale(1.1)'
                                }}
                            />
                        </motion.div>
                    </AnimatePresence>

                    <div className="absolute inset-0 bg-gradient-to-br from-[#FF5900]/90 via-[#FF6B1A]/75 to-[#FF8A4D]/85"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-white/10"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>

                    <div className="absolute top-1/6 left-1/5 w-72 h-72 bg-white/8 rounded-full blur-3xl animate-float opacity-60"></div>
                    <div className="absolute bottom-1/4 right-1/5 w-56 h-56 bg-white/12 rounded-full blur-2xl animate-float-reverse opacity-70"></div>
                    <div className="absolute top-1/2 right-1/4 w-40 h-40 bg-white/15 rounded-full blur-xl animate-pulse-slow opacity-80"></div>

                    <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=&quot;60&quot; height=&quot;60&quot; viewBox=&quot;0 0 60 60&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot;%3E%3Cg fill=&quot;none&quot; fill-rule=&quot;evenodd&quot;%3E%3Cg fill=&quot;%23ffffff&quot; fill-opacity=&quot;0.08&quot;%3E%3Ccircle cx=&quot;30&quot; cy=&quot;30&quot; r=&quot;2&quot;/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>
                </div>

                <div className="relative z-10 flex flex-col justify-between p-12 text-white h-full">
                    <div className="space-y-8">
                        <motion.div
                            className="flex items-center gap-4 cursor-pointer group"
                            onClick={handleLogoClick}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <div className="relative h-12 w-12 bg-white/25 backdrop-blur-lg rounded-tr-xl rounded-bl-xl flex items-center justify-center shadow-2xl overflow-hidden border border-white/30 group-hover:bg-white/30 transition-all duration-300">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                                <Image
                                    src="/images/contents/rovi-logo.png"
                                    alt="Rovify Logo"
                                    width={32}
                                    height={32}
                                    className="object-contain relative z-10 group-hover:scale-110 transition-transform duration-300"
                                />
                            </div>
                            <div>
                                <span className="text-3xl font-bold tracking-tight">rovify</span>
                                <div className="text-xs text-white/75 font-light tracking-widest uppercase">Event Platform</div>
                            </div>
                        </motion.div>

                        {/* Dynamic Rotating Messages */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentMessageIndex}
                                initial={{ opacity: 0, y: 30, rotateX: -15 }}
                                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                                exit={{ opacity: 0, y: -30, rotateX: 15 }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className="space-y-6 max-w-lg"
                            >
                                <h1 className="text-3xl font-bold leading-tight">
                                    <span className="block text-white">{DYNAMIC_MESSAGES[currentMessageIndex].title}</span>
                                    <span className="block bg-gradient-to-r from-white via-orange-100 to-yellow-100 bg-clip-text text-transparent">
                                        {DYNAMIC_MESSAGES[currentMessageIndex].subtitle}
                                    </span>
                                </h1>
                                <p className="text-white/85 text-base leading-relaxed font-light">
                                    {DYNAMIC_MESSAGES[currentMessageIndex].description}
                                </p>
                            </motion.div>
                        </AnimatePresence>

                        {/* Creator Stats Counter */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.8 }}
                            className="flex gap-8"
                        >
                            {CREATOR_STATS.map((stat, index) => (
                                <motion.div
                                    key={stat.label}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                                    className="text-center"
                                >
                                    <div className="mb-3 flex justify-center">
                                        <GlassEmoji type={stat.icon} size="w-10 h-10" />
                                    </div>
                                    <div className="text-xl font-bold text-white">{stat.value}</div>
                                    <div className="text-xs text-white/70 font-light">{stat.label}</div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>

                    {/* Updated Web3 Features */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        className="space-y-4 max-w-lg"
                    >
                        {WEB3_FEATURES.map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, x: -30 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.6 + index * 0.15, duration: 0.6 }}
                                className="group"
                            >
                                <div className="flex items-center gap-4 p-4 bg-white/10 backdrop-blur-lg rounded-tr-2xl rounded-bl-2xl border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all duration-500 hover:shadow-2xl hover:shadow-white/10">
                                    <div className="flex-shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                                        <GlassEmoji type={feature.icon} size="w-12 h-12" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-base font-semibold text-white mb-1 group-hover:text-orange-100 transition-colors duration-300">
                                            {feature.title}
                                        </h3>
                                        <p className="text-xs text-white/75 leading-relaxed font-light">
                                            {feature.description}
                                        </p>
                                    </div>
                                    <div className="w-2 h-8 bg-gradient-to-b from-white/30 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex gap-3">
                                {EVENT_IMAGES.map((_, index) => (
                                    <motion.div
                                        key={index}
                                        className={`h-2 rounded-full transition-all duration-500 cursor-pointer hover:scale-125 ${index === currentImageIndex
                                            ? 'w-8 bg-white shadow-lg'
                                            : 'w-2 bg-white/40 hover:bg-white/70'
                                            }`}
                                        whileHover={{ scale: 1.2 }}
                                        onClick={() => setCurrentImageIndex(index)}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column - Enhanced Form with Better UX */}
            <div className="w-full lg:w-1/2 flex items-center justify-center min-h-screen bg-white relative overflow-hidden">
                <div className="absolute inset-0 lg:hidden">
                    <div className="absolute top-1/4 -left-24 w-96 h-96 bg-[#FF5900]/5 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-float"></div>
                    <div className="absolute bottom-1/4 -right-24 w-96 h-96 bg-[#FF5900]/5 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-float-reverse"></div>
                </div>

                <div className="lg:hidden absolute top-8 left-1/2 transform -translate-x-1/2">
                    <motion.div
                        className="flex items-center gap-3 cursor-pointer"
                        onClick={handleLogoClick}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <div className="h-10 w-10 bg-gradient-to-br from-[#FF5900] to-[#FF8A4D] rounded-tr-xl rounded-bl-xl flex items-center justify-center shadow-lg overflow-hidden">
                            <Image
                                src="/images/contents/rovi-logo.png"
                                alt="Rovify Logo"
                                width={28}
                                height={28}
                                className="object-contain"
                            />
                        </div>
                        <span className="text-2xl font-bold bg-gradient-to-r from-[#FF5900] to-[#FF8A4D] bg-clip-text text-transparent">
                            rovify
                        </span>
                    </motion.div>
                </div>

                <div className="w-full max-w-md px-6 py-8 lg:px-8 relative z-10 mt-16 lg:mt-0">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="bg-white/95 backdrop-blur-xl rounded-tr-3xl rounded-bl-3xl shadow-2xl border border-white/60 p-8 relative overflow-hidden"
                    >
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-[#FF5900]/3 to-[#FF8A4D]/3 rounded-full animate-spin-slow"></div>
                        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-gradient-to-tr from-[#FF6B1A]/3 to-[#FFAB91]/3 rounded-full animate-spin-reverse"></div>

                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>

                        <div className="relative z-10">
                            <div className="text-center mb-8">
                                <motion.h1
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="text-2xl font-semibold text-gray-800 mb-2"
                                >
                                    Welcome to Rovify
                                </motion.h1>
                                <motion.p
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="text-gray-500 text-sm"
                                >
                                    Sign in to access your account
                                </motion.p>
                            </div>

                            <AnimatePresence>
                                {showSecretPanel && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="mb-6 p-4 bg-gradient-to-r from-slate-50 to-gray-50 border border-gray-200 rounded-tr-2xl rounded-bl-2xl overflow-hidden"
                                    >
                                        <div className="text-center mb-3">
                                            <div className="text-xs text-gray-600 font-medium">🎭 Demo Access</div>
                                        </div>
                                        <div className="space-y-2">
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => handleDemoLogin('admin')}
                                                className="w-full flex items-center gap-3 p-3 rounded-tr-xl rounded-bl-xl bg-white hover:bg-purple-50 border border-gray-200 hover:border-purple-200 transition-all duration-200 group"
                                            >
                                                <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-tr-lg rounded-bl-lg flex items-center justify-center">
                                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                                    </svg>
                                                </div>
                                                <div className="text-left">
                                                    <div className="text-sm font-medium text-gray-800">Admin</div>
                                                    <div className="text-xs text-gray-500">admin@rovify.io</div>
                                                </div>
                                            </motion.button>

                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => handleDemoLogin('organiser')}
                                                className="w-full flex items-center gap-3 p-3 rounded-tr-xl rounded-bl-xl bg-white hover:bg-orange-50 border border-gray-200 hover:border-orange-200 transition-all duration-200 group"
                                            >
                                                <div className="w-6 h-6 bg-gradient-to-br from-orange-400 to-red-500 rounded-tr-lg rounded-bl-lg flex items-center justify-center">
                                                    <FiCalendar className="w-3 h-3 text-white" />
                                                </div>
                                                <div className="text-left">
                                                    <div className="text-sm font-medium text-gray-800">Organiser</div>
                                                    <div className="text-xs text-gray-500">organiser@rovify.io</div>
                                                </div>
                                            </motion.button>

                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => handleDemoLogin('attendee')}
                                                className="w-full flex items-center gap-3 p-3 rounded-tr-xl rounded-bl-xl bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-200 transition-all duration-200 group"
                                            >
                                                <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-tr-lg rounded-bl-lg flex items-center justify-center">
                                                    <FiUser className="w-3 h-3 text-white" />
                                                </div>
                                                <div className="text-left">
                                                    <div className="text-sm font-medium text-gray-800">Attendee</div>
                                                    <div className="text-xs text-gray-500">attendee@rovify.io</div>
                                                </div>
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="mb-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 text-red-600 rounded-xl border border-red-200 flex items-center animate-shake"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-sm">{error}</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                {/* Enhanced Email Field with Validation */}
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="group"
                                >
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-300 group-focus-within:text-[#FF5900]">
                                            <FiMail className="h-4 w-4 text-gray-400 group-focus-within:text-[#FF5900]" />
                                        </div>
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="premium-input pl-11 pr-4 py-3 w-full rounded-tr-2xl rounded-bl-2xl bg-white/80 backdrop-blur-sm border border-gray-200/80 focus:outline-none focus:ring-2 focus:ring-[#FF5900] focus:border-transparent transition-all duration-300 text-gray-800 placeholder-gray-400"
                                            placeholder="Enter email address"
                                        />
                                        {email && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="absolute inset-y-0 right-0 pr-4 flex items-center"
                                            >
                                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                            </motion.div>
                                        )}
                                    </div>
                                </motion.div>

                                {/* Enhanced Password Field */}
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="group"
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                            Password
                                        </label>
                                        <Link
                                            href="/auth/forgot-password"
                                            className="text-sm text-[#FF5900] hover:text-[#E64A19] transition-colors duration-300 hover:underline"
                                        >
                                            Forgot Password?
                                        </Link>
                                    </div>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-300 group-focus-within:text-[#FF5900]">
                                            <FiLock className="h-4 w-4 text-gray-400 group-focus-within:text-[#FF5900]" />
                                        </div>
                                        <input
                                            id="password"
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="premium-input pl-11 pr-12 py-3 w-full rounded-tr-2xl rounded-bl-2xl bg-white/80 backdrop-blur-sm border border-gray-200/80 focus:outline-none focus:ring-2 focus:ring-[#FF5900] focus:border-transparent transition-all duration-300 text-gray-800 placeholder-gray-400"
                                            placeholder="Enter password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-[#FF5900] transition-colors duration-300"
                                        >
                                            {showPassword ? (
                                                <FiEyeOff className="h-4 w-4" />
                                            ) : (
                                                <FiEye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                </motion.div>

                                {/* Remember Me */}
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.5 }}
                                    className="flex items-center justify-between"
                                >
                                    <div className="flex items-center">
                                        <input
                                            id="remember-me"
                                            name="remember-me"
                                            type="checkbox"
                                            className="h-4 w-4 text-[#FF5900] focus:ring-[#FF5900] border-gray-300 rounded-md transition-colors duration-300"
                                        />
                                        <label htmlFor="remember-me" className="ml-3 text-sm text-gray-600">
                                            Keep me signed in
                                        </label>
                                    </div>
                                </motion.div>

                                {/* Enhanced Submit Button */}
                                <motion.button
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.6 }}
                                    whileHover={{ scale: 1.01, y: -2 }}
                                    whileTap={{ scale: 0.99 }}
                                    type="submit"
                                    disabled={isLoading || isBaseLoading}
                                    className="w-full premium-button flex justify-center items-center gap-3 py-3.5 px-6 rounded-tr-2xl rounded-bl-2xl bg-gradient-to-r from-[#FF5900] to-[#FF8A4D] text-white font-medium shadow-lg hover:shadow-xl transform transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-[#FF5900]/20 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none group relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-[#FF8A4D] to-[#FF5900] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <div className="relative z-10 flex items-center gap-2">
                                        {isLoading || isBaseLoading ? (
                                            <>
                                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                <span>Signing in...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>Login</span>
                                                <FiArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
                                            </>
                                        )}
                                    </div>
                                </motion.button>
                            </form>

                            {/* Social Login */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7 }}
                                className="mt-6"
                            >
                                <div className="relative flex items-center justify-center mb-5">
                                    <div className="border-t border-gray-200 absolute w-full"></div>
                                    <div className="bg-white px-4 relative text-xs text-gray-500 font-medium">
                                        Or continue with
                                    </div>
                                </div>

                                <div className="flex justify-center gap-3">
                                    {/* Google */}
                                    <motion.button
                                        whileHover={{ scale: 1.05, y: -2 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleGoogleLogin}
                                        disabled={isLoading || isBaseLoading}
                                        className="premium-social-button flex justify-center items-center w-12 h-12 rounded-tr-2xl rounded-bl-2xl bg-white/90 backdrop-blur-sm border border-gray-200/80 hover:bg-white hover:border-gray-300 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg group"
                                    >
                                        <Image
                                            src={GoogleIcon}
                                            alt="Google"
                                            width={20}
                                            height={20}
                                            className="transition-transform duration-300 group-hover:scale-110"
                                        />
                                    </motion.button>

                                    {/* Base */}
                                    {walletAvailable && (
                                        <motion.button
                                            whileHover={{ scale: 1.05, y: -2 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={handleBaseLogin}
                                            disabled={isLoading || isBaseLoading}
                                            className="premium-social-button flex justify-center items-center w-12 h-12 rounded-tr-2xl rounded-bl-2xl bg-white/90 backdrop-blur-sm border border-gray-200/80 hover:bg-white hover:border-gray-300 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg group"
                                        >
                                            <Image
                                                src={BaseIcon}
                                                alt="Base"
                                                width={20}
                                                height={20}
                                                className="transition-transform duration-300 group-hover:scale-110"
                                            />
                                        </motion.button>
                                    )}
                                </div>
                            </motion.div>

                            {/* Sign Up Link */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.8 }}
                                className="mt-6 text-center"
                            >
                                <p className="text-sm text-gray-600">
                                    Don&apos;t have an account?{' '}
                                    <Link
                                        href="/auth/register"
                                        className="font-medium text-[#FF5900] hover:text-[#E64A19] transition-all duration-300 hover:underline"
                                    >
                                        Create an account
                                    </Link>
                                </p>
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* Footer - Mobile Only */}
                    <div className="lg:hidden mt-8 text-center text-gray-500 text-sm">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1 }}
                        >
                            <div className="flex justify-center space-x-6 mb-3">
                                <Link href="/terms" className="hover:text-gray-700 transition-colors duration-300">Terms</Link>
                                <Link href="/privacy" className="hover:text-gray-700 transition-colors duration-300">Privacy</Link>
                                <Link href="/help" className="hover:text-gray-700 transition-colors duration-300">Help</Link>
                            </div>
                            <div className="opacity-75">
                                © {new Date().getFullYear()} Rovify. All rights reserved.
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Enhanced Styles */}
            <style jsx global>{`
                .premium-input {
                    box-shadow: 
                        inset 2px 2px 4px rgba(0, 0, 0, 0.05),
                        inset -2px -2px 4px rgba(255, 255, 255, 0.8),
                        0 4px 12px rgba(0, 0, 0, 0.05);
                }
                
                .premium-input:focus {
                    box-shadow: 
                        inset 1px 1px 2px rgba(255, 89, 0, 0.1),
                        inset -1px -1px 2px rgba(255, 255, 255, 0.9),
                        0 0 0 3px rgba(255, 89, 0, 0.1),
                        0 8px 25px rgba(255, 89, 0, 0.15);
                }
                
                .premium-button {
                    box-shadow: 
                        0 8px 32px rgba(255, 89, 0, 0.3),
                        inset 0 1px 0 rgba(255, 255, 255, 0.2);
                }
                
                .premium-button:hover {
                    box-shadow: 
                        0 12px 40px rgba(255, 89, 0, 0.4),
                        inset 0 1px 0 rgba(255, 255, 255, 0.3);
                }
                
                .premium-social-button {
                    box-shadow: 
                        0 4px 12px rgba(0, 0, 0, 0.08),
                        inset 0 1px 0 rgba(255, 255, 255, 0.5);
                }
                
                .premium-social-button:hover {
                    box-shadow: 
                        0 8px 25px rgba(0, 0, 0, 0.12),
                        inset 0 1px 0 rgba(255, 255, 255, 0.7);
                }

                /* Glassmorphism Enhancement */
                .glass-emoji {
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    box-shadow: 
                        0 8px 32px rgba(0, 0, 0, 0.1),
                        inset 0 1px 0 rgba(255, 255, 255, 0.4),
                        inset 0 -1px 0 rgba(0, 0, 0, 0.1);
                }

                .glass-emoji:hover {
                    transform: translateY(-2px) scale(1.05);
                    box-shadow: 
                        0 12px 40px rgba(0, 0, 0, 0.15),
                        inset 0 1px 0 rgba(255, 255, 255, 0.6),
                        inset 0 -1px 0 rgba(0, 0, 0, 0.1);
                }

                @keyframes float {
                    0%, 100% { transform: translate(0, 0) rotate(0deg); }
                    33% { transform: translate(-15px, 15px) rotate(3deg); }
                    66% { transform: translate(8px, -12px) rotate(-2deg); }
                }

                @keyframes float-reverse {
                    0%, 100% { transform: translate(0, 0) rotate(0deg); }
                    33% { transform: translate(15px, 12px) rotate(-3deg); }
                    66% { transform: translate(-8px, -15px) rotate(2deg); }
                }

                @keyframes pulse-slow {
                    0%, 100% { opacity: 0.3; transform: scale(1); }
                    50% { opacity: 0.6; transform: scale(1.05); }
                }

                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }

                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }

                @keyframes glass-glow {
                    0%, 100% { 
                        box-shadow: 
                            0 0 20px rgba(255, 255, 255, 0.2),
                            inset 0 1px 0 rgba(255, 255, 255, 0.4);
                    }
                    50% { 
                        box-shadow: 
                            0 0 30px rgba(255, 255, 255, 0.4),
                            inset 0 1px 0 rgba(255, 255, 255, 0.6);
                    }
                }

                .animate-float { animation: float 20s ease-in-out infinite; }
                .animate-float-reverse { animation: float-reverse 18s ease-in-out infinite; }
                .animate-pulse-slow { animation: pulse-slow 4s ease-in-out infinite; }
                .animate-spin-slow { animation: spin-slow 30s linear infinite; }
                .animate-spin-reverse { animation: spin-slow 25s linear infinite reverse; }
                .animate-shimmer { animation: shimmer 3s ease-in-out infinite; }
                .animate-shake { animation: shake 0.5s ease-in-out; }
                .animate-glass-glow { animation: glass-glow 4s ease-in-out infinite; }
                .animate-glass-breathe { animation: glass-breathe 3s ease-in-out infinite; }
            `}</style>
        </div >
    );
}