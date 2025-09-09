import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { supabase, supabaseAdmin, handleSupabaseError } from '@/lib/supabase';
import { z } from 'zod';

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  bio: z.string().max(500).optional(),
  image: z.string().url().optional(),
  username: z.string().min(3).optional(),
  interests: z.array(z.string()).optional(),
  twitter: z.string().optional(),
  instagram: z.string().optional(),
  website: z.string().url().optional(),
  preferences: z.object({
    notifications: z.boolean().optional(),
    newsletter: z.boolean().optional(),
    notificationTypes: z.array(z.string()).optional(),
    locationRadius: z.number().optional(),
    currency: z.string().optional(),
  }).optional(),
});

// GET /api/users/[id] - Get user profile
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        id,
        name,
        username,
        bio,
        image,
        interests,
        followers_count,
        following_count,
        twitter,
        instagram,
        website,
        verified,
        created_at,
        saved_events,
        attended_events,
        created_events
      `)
      .eq('id', params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      handleSupabaseError(error);
    }

    // Get user's created events
    let createdEvents = [];
    if (user.created_events && user.created_events.length > 0) {
      const { data: events } = await supabase
        .from('events')
        .select('id, title, image, date, category, status')
        .in('id', user.created_events)
        .eq('status', 'published')
        .order('date', { ascending: false });
      
      createdEvents = events || [];
    }

    return NextResponse.json({
      ...user,
      createdEvents,
    });

  } catch (error) {
    console.error('User GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id] - Update user profile
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is updating their own profile
    if (session.user.id !== params.id) {
      return NextResponse.json(
        { error: 'Unauthorized to update this profile' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateUserSchema.parse(body);

    // Check if username is taken (if being updated)
    if (validatedData.username) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('username', validatedData.username)
        .neq('id', params.id)
        .single();

      if (existingUser) {
        return NextResponse.json(
          { error: 'Username is already taken' },
          { status: 400 }
        );
      }
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .update(validatedData)
      .eq('id', params.id)
      .select(`
        id,
        name,
        username,
        email,
        bio,
        image,
        interests,
        followers_count,
        following_count,
        twitter,
        instagram,
        website,
        verified,
        preferences,
        created_at
      `)
      .single();

    if (error) {
      handleSupabaseError(error);
    }

    return NextResponse.json(user);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('User update error:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}
