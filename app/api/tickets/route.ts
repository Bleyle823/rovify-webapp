import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { supabase, supabaseAdmin, handleSupabaseError } from '@/lib/supabase';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const purchaseTicketSchema = z.object({
  event_id: z.string().uuid(),
  type: z.string(),
  tier_name: z.string().optional(),
  payment_method: z.enum(['stripe', 'crypto']),
  payment_id: z.string().optional(),
  seat_info: z.object({
    section: z.string().optional(),
    row: z.string().optional(),
    seat: z.string().optional(),
    timeSlot: z.string().optional(),
  }).optional(),
});

// GET /api/tickets - Get user's tickets
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const event_id = searchParams.get('event_id');

    let query = supabase
      .from('tickets')
      .select(`
        *,
        event:events(
          id,
          title,
          description,
          image,
          date,
          end_date,
          location,
          organiser:users!events_organiser_id_fkey(
            id,
            name,
            image,
            verified
          )
        )
      `)
      .eq('owner_id', session.user.id)
      .order('purchase_date', { ascending: false });

    if (status) {
      query = query.eq('status', status.toUpperCase());
    }

    if (event_id) {
      query = query.eq('event_id', event_id);
    }

    const { data: tickets, error } = await query;

    if (error) {
      handleSupabaseError(error);
    }

    return NextResponse.json({ tickets });

  } catch (error) {
    console.error('Tickets GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}

// POST /api/tickets - Purchase ticket
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
    const validatedData = purchaseTicketSchema.parse(body);

    // Get event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', validatedData.event_id)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Check if event is published and tickets are available
    if (event.status !== 'published') {
      return NextResponse.json(
        { error: 'Event is not available for ticket purchase' },
        { status: 400 }
      );
    }

    if (event.total_tickets && event.sold_tickets >= event.total_tickets) {
      return NextResponse.json(
        { error: 'Event is sold out' },
        { status: 400 }
      );
    }

    // Check user ticket limit
    const { data: userTickets } = await supabase
      .from('tickets')
      .select('id')
      .eq('event_id', validatedData.event_id)
      .eq('owner_id', session.user.id);

    if (userTickets && userTickets.length >= (event.max_tickets_per_user || 10)) {
      return NextResponse.json(
        { error: 'Maximum tickets per user exceeded' },
        { status: 400 }
      );
    }

    // Calculate price (simplified - in production you'd have complex pricing logic)
    const price = event.price?.min || 0;
    const currency = event.price?.currency || 'USD';

    // Create ticket
    const ticketData = {
      event_id: validatedData.event_id,
      owner_id: session.user.id,
      type: validatedData.type,
      tier_name: validatedData.tier_name,
      price: price,
      currency: currency,
      is_nft: event.has_nft_tickets,
      seat_info: validatedData.seat_info,
      verification_code: uuidv4().replace(/-/g, '').substring(0, 12).toUpperCase(),
      metadata: {
        purchase_method: validatedData.payment_method,
        payment_id: validatedData.payment_id,
        issued_by: 'Rovify Platform',
      },
    };

    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from('tickets')
      .insert(ticketData)
      .select(`
        *,
        event:events(
          id,
          title,
          description,
          image,
          date,
          end_date,
          location
        )
      `)
      .single();

    if (ticketError) {
      handleSupabaseError(ticketError);
    }

    // Update event sold_tickets count
    await supabaseAdmin
      .from('events')
      .update({ sold_tickets: event.sold_tickets + 1 })
      .eq('id', validatedData.event_id);

    // Create transaction record
    await supabaseAdmin
      .from('transactions')
      .insert({
        user_id: session.user.id,
        ticket_id: ticket.id,
        event_id: validatedData.event_id,
        type: 'purchase',
        amount: price,
        currency: currency,
        payment_method: validatedData.payment_method,
        payment_id: validatedData.payment_id,
        status: 'completed',
      });

    // Add to user's attended events
    await supabaseAdmin
      .from('users')
      .update({
        attended_events: supabase.rpc('array_append', {
          arr: 'attended_events',
          elem: validatedData.event_id
        })
      })
      .eq('id', session.user.id);

    return NextResponse.json(ticket, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Ticket purchase error:', error);
    return NextResponse.json(
      { error: 'Failed to purchase ticket' },
      { status: 500 }
    );
  }
}
