import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { supabase, supabaseAdmin, handleSupabaseError } from '@/lib/supabase';
import { z } from 'zod';

const eventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  image: z.string().url().optional(),
  date: z.string().datetime(),
  end_date: z.string().datetime().optional(),
  location: z.object({
    name: z.string(),
    address: z.string(),
    city: z.string(),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number(),
    }),
  }),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  tags: z.array(z.string()).optional(),
  price: z.object({
    min: z.number().min(0),
    max: z.number().min(0),
    currency: z.string().default('USD'),
  }).optional(),
  has_nft_tickets: z.boolean().default(false),
  total_tickets: z.number().min(1).optional(),
  venue_capacity: z.number().min(1).optional(),
});

// GET /api/events - Get events with optional filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');
    const organiser_id = searchParams.get('organiser_id');
    const status = searchParams.get('status') || 'published';
    const has_nft_tickets = searchParams.get('has_nft_tickets');

    let query = supabase
      .from('events')
      .select(`
        *,
        organiser:users!events_organiser_id_fkey(
          id, 
          name, 
          image, 
          verified,
          username
        )
      `)
      .eq('status', status)
      .order('date', { ascending: true })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (category) {
      query = query.eq('category', category.toUpperCase());
    }

    if (organiser_id) {
      query = query.eq('organiser_id', organiser_id);
    }

    if (has_nft_tickets) {
      query = query.eq('has_nft_tickets', has_nft_tickets === 'true');
    }

    if (search) {
      query = query.textSearch('title', search, { type: 'websearch' });
    }

    const { data, error, count } = await query;

    if (error) {
      handleSupabaseError(error);
    }

    return NextResponse.json({
      events: data,
      total: count,
      limit,
      offset,
    });

  } catch (error) {
    console.error('Events GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

// POST /api/events - Create new event
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = eventSchema.parse(body);

    // Create event
    const { data: event, error } = await supabaseAdmin
      .from('events')
      .insert({
        ...validatedData,
        organiser_id: session.user.id,
        status: 'draft', // Events start as draft
      })
      .select(`
        *,
        organiser:users!events_organiser_id_fkey(
          id, 
          name, 
          image, 
          verified,
          username
        )
      `)
      .single();

    if (error) {
      handleSupabaseError(error);
    }

    // Update user's created_events array
    await supabaseAdmin
      .from('users')
      .update({
        created_events: supabase.rpc('array_append', {
          arr: 'created_events',
          elem: event.id
        })
      })
      .eq('id', session.user.id);

    return NextResponse.json(event, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Event creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}
