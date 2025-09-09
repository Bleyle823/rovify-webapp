import { NextRequest, NextResponse } from 'next/server';
import { supabase, handleSupabaseError, supabaseAdmin } from '@/lib/supabase';

// GET /api/users - Get users with optional filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');
    const role = searchParams.get('role'); // 'organiser', 'admin', etc.
    const verified = searchParams.get('verified');

    let query = supabase
      .from('users')
      .select(`
        id,
        name,
        email,
        image,
        bio,
        username,
        verified,
        is_organiser,
        is_admin,
        followers_count,
        following_count,
        interests,
        twitter,
        instagram,
        website,
        created_at
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (role === 'organiser') {
      query = query.eq('is_organiser', true);
    } else if (role === 'admin') {
      query = query.eq('is_admin', true);
    }

    if (verified) {
      query = query.eq('verified', verified === 'true');
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%, email.ilike.%${search}%, username.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      handleSupabaseError(error);
    }

    return NextResponse.json({
      users: data,
      total: count,
      limit,
      offset,
    });

  } catch (error) {
    console.error('Users GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, email, name, image, auth_method } = body || {};

    if (!id) {
      return NextResponse.json({ error: 'Missing user id' }, { status: 400 });
    }

    // Use service role to bypass RLS for initial profile creation
    const { data, error } = await supabaseAdmin
      .from('users')
      .upsert({
        id,
        email: email ?? null,
        name: name ?? null,
        image: image ?? null,
        auth_method: auth_method ?? 'email',
        is_organiser: false,
        is_admin: false,
        verified: false,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
      .select('id, email, name, image, auth_method, is_organiser, is_admin, verified')
      .single();

    if (error) handleSupabaseError(error);

    return NextResponse.json({ user: data }, { status: 200 });
  } catch (error) {
    console.error('Users POST error:', error);
    return NextResponse.json(
      { error: 'Failed to upsert user profile' },
      { status: 500 }
    );
  }
}
