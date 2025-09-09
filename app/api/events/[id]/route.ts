import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { supabase, supabaseAdmin, handleSupabaseError } from '@/lib/supabase';
import { z } from 'zod';

const updateEventSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  image: z.string().url().optional(),
  date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  location: z.object({
    name: z.string(),
    address: z.string(),
    city: z.string(),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number(),
    }),
  }).optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  tags: z.array(z.string()).optional(),
  price: z.object({
    min: z.number().min(0),
    max: z.number().min(0),
    currency: z.string(),
  }).optional(),
  has_nft_tickets: z.boolean().optional(),
  total_tickets: z.number().min(1).optional(),
  venue_capacity: z.number().min(1).optional(),
  status: z.enum(['draft', 'published', 'cancelled', 'completed']).optional(),
});

// GET /api/events/[id] - Get specific event
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: event, error } = await supabase
      .from('events')
      .select(`
        *,
        organiser:users!events_organiser_id_fkey(
          id, 
          name, 
          image, 
          verified,
          username,
          bio
        ),
        tickets:tickets(
          id,
          type,
          price,
          currency,
          is_nft,
          status
        )
      `)
      .eq('id', params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Event not found' },
          { status: 404 }
        );
      }
      handleSupabaseError(error);
    }

    // Increment view count
    await supabaseAdmin
      .from('events')
      .update({ views: (event.views || 0) + 1 })
      .eq('id', params.id);

    return NextResponse.json(event);

  } catch (error) {
    console.error('Event GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    );
  }
}

// PUT /api/events/[id] - Update event
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

    // Check if user owns the event
    const { data: existingEvent } = await supabase
      .from('events')
      .select('organiser_id')
      .eq('id', params.id)
      .single();

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    if (existingEvent.organiser_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to update this event' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateEventSchema.parse(body);

    const { data: event, error } = await supabaseAdmin
      .from('events')
      .update(validatedData)
      .eq('id', params.id)
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

    return NextResponse.json(event);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Event update error:', error);
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    );
  }
}

// DELETE /api/events/[id] - Delete event
export async function DELETE(
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

    // Check if user owns the event
    const { data: existingEvent } = await supabase
      .from('events')
      .select('organiser_id, sold_tickets')
      .eq('id', params.id)
      .single();

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    if (existingEvent.organiser_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this event' },
        { status: 403 }
      );
    }

    // Check if tickets have been sold
    if (existingEvent.sold_tickets > 0) {
      return NextResponse.json(
        { error: 'Cannot delete event with sold tickets' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('events')
      .delete()
      .eq('id', params.id);

    if (error) {
      handleSupabaseError(error);
    }

    return NextResponse.json({ message: 'Event deleted successfully' });

  } catch (error) {
    console.error('Event deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    );
  }
}
