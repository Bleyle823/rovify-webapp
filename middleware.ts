/* eslint-disable @typescript-eslint/no-unused-vars */
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from '@/types/supabase';

export async function middleware(request: NextRequest) {
    const res = NextResponse.next();
    const supabase = createMiddlewareClient<Database>({ req: request, res });
    
    // Get session
    const { data: { session } } = await supabase.auth.getSession();
    
    // Define public paths that don't require authentication
    const publicPaths = [
        '/',
        '/auth/login',
        '/auth/register', 
        '/auth/callback',
        '/auth/forgot-password',
        '/forbidden',
        '/maintenance',
        '/terms',
        '/privacy',
        '/help',
        '/legal'
    ];

    // Check if current path is public
    const isPublicPath = publicPaths.some(path => 
        request.nextUrl.pathname === path || 
        request.nextUrl.pathname.startsWith(path + '/')
    );

    // Check if path is API route
    const isApiRoute = request.nextUrl.pathname.startsWith('/api/');
    
    // Check if path is Next.js internal
    const isNextInternal = request.nextUrl.pathname.startsWith('/_next/') ||
                          request.nextUrl.pathname.startsWith('/favicon.ico');

    // Allow Next.js internals and API routes to pass through
    if (isNextInternal || isApiRoute) {
        return res;
    }

    // If user is not authenticated and trying to access protected route
    if (!session && !isPublicPath) {
        console.log('🛡️ MIDDLEWARE: Redirecting unauthenticated user to login');
        const redirectUrl = new URL('/auth/login', request.url);
        redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
        return NextResponse.redirect(redirectUrl);
    }

    // If user is authenticated and trying to access auth pages, redirect to home
    if (session && (request.nextUrl.pathname.startsWith('/auth/') && request.nextUrl.pathname !== '/auth/callback')) {
        console.log('🛡️ MIDDLEWARE: Redirecting authenticated user to home');
        return NextResponse.redirect(new URL('/home', request.url));
    }

    return res;
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};