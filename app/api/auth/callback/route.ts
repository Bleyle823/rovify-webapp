import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const redirectTo = requestUrl.searchParams.get('redirectTo') || '/home';

    if (code) {
        const cookieStore = cookies();
        const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
        
        try {
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);
            
            if (error) {
                console.error('Auth callback error:', error);
                return NextResponse.redirect(new URL('/auth/login?error=Authentication failed', request.url));
            }

            console.log('Auth callback successful');
            return NextResponse.redirect(new URL(redirectTo, request.url));
        } catch (error) {
            console.error('Auth callback error:', error);
            return NextResponse.redirect(new URL('/auth/login?error=Authentication failed', request.url));
        }
    }

    // No code present, redirect to login
    return NextResponse.redirect(new URL('/auth/login', request.url));
}
