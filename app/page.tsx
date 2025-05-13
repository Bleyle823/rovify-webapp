/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import RoviLogo from '@/public/images/contents/rovi-logo.png';

export default function RootPage() {
  const { isLoading } = useAuth({
    redirectIfAuthenticated: '/discover',
    redirectIfUnauthenticated: '/auth/login'
  });

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white">
      <div className="flex flex-col items-center">
        <div className="h-12 w-12 bg-gradient-to-br from-[#FF5722] to-[#FF7A50] rounded-xl flex items-center justify-center shadow-lg animate-pulse">
          <Image
            src={RoviLogo}
            alt="Rovify Logo"
            width={32}
            height={32}
            className="object-contain"
          />
        </div>
        <p className="mt-4 text-gray-500">Loading...</p>
      </div>
    </div>
  );
}