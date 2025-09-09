/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight, FiCheck } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import RoviLogo from '@/public/images/contents/rovi-logo.png';
import GoogleIcon from '@/public/images/icons/google-logo.svg';
import MetaMaskIcon from '@/public/images/icons/metamask-logo.svg';
import AppleIcon from '@/public/images/icons/apple-logo.svg';

export default function RegisterPage() {
    const router = useRouter();
    const { register, loginWithProvider } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState(1);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const validateStep1 = () => {
        if (!formData.name.trim()) {
            setError('Name is required');
            return false;
        }
        if (!formData.email.trim()) {
            setError('Email is required');
            return false;
        }
        if (!/\S+@\S+\.\S+/.test(formData.email)) {
            setError('Please enter a valid email address');
            return false;
        }
        return true;
    };

    const handleNextStep = () => {
        setError('');
        if (validateStep1()) {
            setStep(2);
        }
    };

    const validatePassword = (password: string) => {
        const minLength = password.length >= 8;
        const hasUppercase = /[A-Z]/.test(password);
        const hasLowercase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);

        return {
            minLength,
            hasUppercase,
            hasLowercase,
            hasNumber,
            valid: minLength && hasUppercase && hasLowercase && hasNumber
        };
    };

    const passwordStrength = validatePassword(formData.password);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validate form
        if (!passwordStrength.valid) {
            setError('Please ensure your password meets all requirements');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setIsLoading(true);

        try {
            await register(formData.name, formData.email, formData.password);
            console.log('🔐 REGISTER: Registration successful');
            // Success feedback will be handled by AuthContext redirect
        } catch (error) {
            console.error('🔐 REGISTER ERROR:', error);
            setError(error instanceof Error ? error.message : 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle Google registration
    const handleGoogleSignup = async () => {
        try {
            console.log('🔐 REGISTER: Starting Google OAuth...');
            setIsLoading(true);
            
            await loginWithProvider('google');
        } catch (error) {
            console.error('🔐 REGISTER ERROR: Google OAuth failed:', error);
            setError(error instanceof Error ? error.message : 'Google authentication failed');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-white to-gray-100 flex items-center justify-center p-4">
            {/* Animated background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-48 -right-48 w-96 h-96 bg-[#FF5722]/10 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float"></div>
                <div className="absolute -bottom-48 -left-48 w-96 h-96 bg-[#FF5722]/10 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float-reverse"></div>

                {/* Grid pattern */}
                <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]"></div>
            </div>

            <div className="w-full max-w-md z-10 relative">
                {/* Logo */}
                <div className="flex justify-center mb-8">
                    <div className="flex items-center gap-2">
                        <div className="h-10 w-10 bg-[#FF5722] rounded-xl flex items-center justify-center shadow-sm overflow-hidden">
                            <Image
                                // src={RoviLogo}
                                src="/images/contents/rovi-logo.png"
                                alt="Rovify Logo"
                                width={32}
                                height={32}
                                className="object-contain"
                            />
                        </div>
                        <span className="text-2xl font-bold text-[#FF5722]">rovify</span>
                    </div>
                </div>

                {/* Auth card */}
                <div className="glass-card rounded-2xl shadow-xl p-8 border border-white/50 relative overflow-hidden">
                    {/* Card background decoration */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#FF5722]/10 rounded-full"></div>
                    <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#FF5722]/10 rounded-full"></div>

                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Create Account</h1>
                    <p className="text-gray-500 mb-6">Join Rovify and discover amazing events</p>

                    {error && (
                        <div className="w-full bg-red-50 text-red-500 px-4 py-3 rounded-lg mb-6 text-sm flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {step === 1 ? (
                            <div className="space-y-4">
                                {/* Name field */}
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <FiUser className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            id="name"
                                            name="name"
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="neumorph-input pl-10 pr-4 py-3 w-full rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5722]"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                </div>

                                {/* Email field */}
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <FiMail className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="neumorph-input pl-10 pr-4 py-3 w-full rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5722]"
                                            placeholder="your@email.com"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleNextStep}
                                    className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#FF5722] to-[#FF7A50] text-white font-medium shadow-lg hover:shadow-xl transform transition-all hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#FF5722] focus:ring-opacity-50"
                                >
                                    Continue
                                    <FiArrowRight className="ml-1" />
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Password field */}
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Create Password</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <FiLock className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            id="password"
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            required
                                            value={formData.password}
                                            onChange={handleChange}
                                            className="neumorph-input pl-10 pr-12 py-3 w-full rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5722]"
                                            placeholder="••••••••"
                                        />
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="text-gray-400 hover:text-gray-600 focus:outline-none"
                                            >
                                                {showPassword ? (
                                                    <FiEyeOff className="h-5 w-5" />
                                                ) : (
                                                    <FiEye className="h-5 w-5" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Password strength indicators */}
                                    <div className="mt-2 space-y-2">
                                        <div className="flex gap-2">
                                            <div className={`h-1 flex-1 rounded-full ${formData.password.length > 0 ? (passwordStrength.minLength ? 'bg-green-500' : 'bg-gray-300') : 'bg-gray-300'}`}></div>
                                            <div className={`h-1 flex-1 rounded-full ${formData.password.length > 0 ? (passwordStrength.hasUppercase ? 'bg-green-500' : 'bg-gray-300') : 'bg-gray-300'}`}></div>
                                            <div className={`h-1 flex-1 rounded-full ${formData.password.length > 0 ? (passwordStrength.hasLowercase ? 'bg-green-500' : 'bg-gray-300') : 'bg-gray-300'}`}></div>
                                            <div className={`h-1 flex-1 rounded-full ${formData.password.length > 0 ? (passwordStrength.hasNumber ? 'bg-green-500' : 'bg-gray-300') : 'bg-gray-300'}`}></div>
                                        </div>

                                        <div className="text-xs text-gray-500 space-y-1">
                                            <div className="flex items-center gap-1">
                                                <div className={`h-3 w-3 rounded-full flex items-center justify-center ${passwordStrength.minLength ? 'bg-green-500' : 'bg-gray-300'}`}>
                                                    {passwordStrength.minLength && <FiCheck className="h-2 w-2 text-white" />}
                                                </div>
                                                <span>At least 8 characters</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <div className={`h-3 w-3 rounded-full flex items-center justify-center ${passwordStrength.hasUppercase ? 'bg-green-500' : 'bg-gray-300'}`}>
                                                    {passwordStrength.hasUppercase && <FiCheck className="h-2 w-2 text-white" />}
                                                </div>
                                                <span>Uppercase letter (A-Z)</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <div className={`h-3 w-3 rounded-full flex items-center justify-center ${passwordStrength.hasLowercase ? 'bg-green-500' : 'bg-gray-300'}`}>
                                                    {passwordStrength.hasLowercase && <FiCheck className="h-2 w-2 text-white" />}
                                                </div>
                                                <span>Lowercase letter (a-z)</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <div className={`h-3 w-3 rounded-full flex items-center justify-center ${passwordStrength.hasNumber ? 'bg-green-500' : 'bg-gray-300'}`}>
                                                    {passwordStrength.hasNumber && <FiCheck className="h-2 w-2 text-white" />}
                                                </div>
                                                <span>Number (0-9)</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Confirm Password field */}
                                <div>
                                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <FiLock className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            type={showPassword ? "text" : "password"}
                                            required
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            className="neumorph-input pl-10 pr-4 py-3 w-full rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5722]"
                                            placeholder="••••••••"
                                        />
                                    </div>

                                    {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                                        <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
                                    )}
                                </div>

                                {/* Terms acceptance */}
                                <div className="flex items-start">
                                    <input
                                        id="terms"
                                        name="terms"
                                        type="checkbox"
                                        required
                                        className="h-4 w-4 text-[#FF5722] focus:ring-[#FF5722] rounded mt-1"
                                    />
                                    <label htmlFor="terms" className="ml-2 block text-sm text-gray-600">
                                        I agree to the <Link href="/terms" className="text-[#FF5722] hover:text-[#E64A19]">Terms of Service</Link> and <Link href="/privacy" className="text-[#FF5722] hover:text-[#E64A19]">Privacy Policy</Link>
                                    </label>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="flex-1 py-3 px-4 rounded-xl bg-white border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#FF5722] focus:ring-opacity-50"
                                    >
                                        Back
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="flex-1 flex justify-center items-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#FF5722] to-[#FF7A50] text-white font-medium shadow-lg hover:shadow-xl transform transition-all hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#FF5722] focus:ring-opacity-50 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Creating...
                                            </>
                                        ) : (
                                            'Create Account'
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>

                    {/* Social logins */}
                    <div className="mt-8">
                        <div className="relative flex items-center justify-center">
                            <div className="border-t border-gray-200 absolute w-full"></div>
                            <div className="bg-white px-4 relative z-10 text-sm text-gray-500">Or continue with</div>
                        </div>

                        <div className="mt-4 flex justify-center gap-3">
                            <button 
                                onClick={handleGoogleSignup}
                                disabled={isLoading}
                                className="neumorph-button flex justify-center items-center py-2.5 px-6 rounded-xl bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Image src={GoogleIcon} alt="Google" width={20} height={20} />
                            </button>
                            {/* <button className="neumorph-button flex justify-center items-center py-2.5 px-6 rounded-xl bg-white hover:bg-gray-50 transition-colors">
                                <Image src={MetaMaskIcon} alt="MetaMask" width={20} height={20} />
                            </button> */}
                            {/* <button className="neumorph-button flex justify-center items-center py-2.5 px-6 rounded-xl bg-white hover:bg-gray-50 transition-colors">
                                <Image src={AppleIcon} alt="Apple" width={20} height={20} />
                            </button> */}
                        </div>
                    </div>

                    {/* Sign in link */}
                    <div className="mt-8 text-center">
                        <p className="text-gray-600">
                            Already have an account?
                            <span className="inline-block ml-2">
                                <Link href="/auth/login" className="font-medium hover:text-[#E64A19]" style={{ color: '#FF5722' }}>
                                    Sign in
                                </Link>
                            </span>
                        </p>
                    </div>
                </div>

                {/* Footer links */}
                <div className="mt-8 text-center text-gray-500 text-sm">
                    <div className="flex justify-center space-x-4">
                        <Link href="/terms" className="hover:text-gray-700">Terms</Link>
                        <Link href="/privacy" className="hover:text-gray-700">Privacy</Link>
                        <Link href="/help" className="hover:text-gray-700">Help</Link>
                    </div>
                    <div className="mt-2">
                        © {new Date().getFullYear()} Rovify. All rights reserved.
                    </div>
                </div>
            </div>

            {/* Custom styles */}
            <style jsx global>{`
        .bg-grid-pattern {
          background-image: url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E");
        }
        
        .glass-card {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        
        .neumorph-input {
          box-shadow: inset 2px 2px 5px rgba(0, 0, 0, 0.05), 
                     inset -2px -2px 5px rgba(255, 255, 255, 0.5);
          transition: all 0.3s ease;
        }
        
        .neumorph-input:focus {
          box-shadow: inset 1px 1px 2px rgba(0, 0, 0, 0.05), 
                     inset -1px -1px 2px rgba(255, 255, 255, 0.5);
        }
        
        .neumorph-button {
          box-shadow: 4px 4px 8px rgba(0, 0, 0, 0.05),
                     -4px -4px 8px rgba(255, 255, 255, 0.5);
          transition: all 0.3s ease;
        }
        
        .neumorph-button:active {
          box-shadow: inset 2px 2px 4px rgba(0, 0, 0, 0.05),
                     inset -2px -2px 4px rgba(255, 255, 255, 0.5);
        }
      `}</style>
        </div>
    );
}