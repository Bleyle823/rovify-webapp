import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { supabaseAdmin, handleSupabaseError } from '@/lib/supabase';

// POST /api/events/[id]/save - Toggle save event
export async function POST(
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

    // Check if already saved
    const { data: existingSave } = await supabaseAdmin
      .from('saved_events')
      .select('id')
      .eq('event_id', params.id)
      .eq('user_id', session.user.id)
      .single();

    let saved = false;

    if (existingSave) {
      // Unsave
      const { error } = await supabaseAdmin
        .from('saved_events')
        .delete()
        .eq('event_id', params.id)
        .eq('user_id', session.user.id);

      if (error) {
        handleSupabaseError(error);
      }

      saved = false;
    } else {
      // Save
      const { error } = await supabaseAdmin
        .from('saved_events')
        .insert({
          event_id: params.id,
          user_id: session.user.id,
        });

      if (error) {
        handleSupabaseError(error);
      }

      saved = true;
    }

    return NextResponse.json({ saved });

  } catch (error) {
    console.error('Event save error:', error);
    return NextResponse.json(
      { error: 'Failed to toggle save' },
      { status: 500 }
    );
  }
}
