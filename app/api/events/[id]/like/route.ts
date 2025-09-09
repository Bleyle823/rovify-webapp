import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { supabaseAdmin, handleSupabaseError } from '@/lib/supabase';

// POST /api/events/[id]/like - Toggle event like
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

    // Check if already liked
    const { data: existingLike } = await supabaseAdmin
      .from('event_likes')
      .select('id')
      .eq('event_id', params.id)
      .eq('user_id', session.user.id)
      .single();

    let liked = false;

    if (existingLike) {
      // Unlike
      const { error } = await supabaseAdmin
        .from('event_likes')
        .delete()
        .eq('event_id', params.id)
        .eq('user_id', session.user.id);

      if (error) {
        handleSupabaseError(error);
      }

      liked = false;
    } else {
      // Like
      const { error } = await supabaseAdmin
        .from('event_likes')
        .insert({
          event_id: params.id,
          user_id: session.user.id,
        });

      if (error) {
        handleSupabaseError(error);
      }

      liked = true;
    }

    // Get updated like count
    const { data: likeCount } = await supabaseAdmin
      .from('event_likes')
      .select('id', { count: 'exact' })
      .eq('event_id', params.id);

    return NextResponse.json({
      liked,
      likes: likeCount?.length || 0,
    });

  } catch (error) {
    console.error('Event like error:', error);
    return NextResponse.json(
      { error: 'Failed to toggle like' },
      { status: 500 }
    );
  }
}
