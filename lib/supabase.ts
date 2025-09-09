import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Get environment variables with fallbacks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qmhuazlqizdqiwmyflgh.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtaHVhemxxaXpkcWl3bXlmbGdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczODk2MzcsImV4cCI6MjA3Mjk2NTYzN30.LYxmXfh7_jkxilNEZvk-5f--H1Fkym-hqQowYB6bBfA';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtaHVhemxxaXpkcWl3bXlmbGdoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzM4OTYzNywiZXhwIjoyMDcyOTY1NjM3fQ.GXHp9S05J4K4zuIP2DSXEXuAIw4PpkSInS0B8q1i66M';

// Check if we're using placeholder values
const isPlaceholder = supabaseUrl === 'https://placeholder.supabase.co' || 
                     supabaseAnonKey === 'placeholder-anon-key' ||
                     supabaseUrl.includes('your-project-id') ||
                     supabaseAnonKey.includes('your-anon-key');

if (isPlaceholder) {
  console.warn('🚨 SUPABASE: Using placeholder values - authentication will not work');
  console.warn('📝 Please update your .env.local file with actual Supabase credentials');
  console.warn('💡 Get your credentials from: https://supabase.com/dashboard');
}

// Client for browser usage
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
});

// Admin client for server-side operations
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Types for database operations
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

// Helper function to handle Supabase errors
export function handleSupabaseError(error: any): never {
  console.error('Supabase error:', error);
  throw new Error(error.message || 'Database operation failed');
}

// Auth helper functions
export const authHelpers = {
  // Sign up with email and password
  async signUp(email: string, password: string, metadata?: any) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    });

    return { data, error };
  },

  // Sign in with email and password
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { data, error };
  },

  // Sign in with OAuth provider
  async signInWithProvider(provider: 'google' | 'github') {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });

    return { data, error };
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) handleSupabaseError(error);
  },

  // Get current session
  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) handleSupabaseError(error);
    return data.session;
  },

  // Get current user
  async getUser() {
    const { data, error } = await supabase.auth.getUser();
    if (error) handleSupabaseError(error);
    return data.user;
  }
};

// Utility functions for common operations
export const supabaseUtils = {
  // Get user profile with error handling
  async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) handleSupabaseError(error);
    return data;
  },

  // Get events with pagination
  async getEvents(params?: {
    limit?: number;
    offset?: number;
    category?: string;
    status?: string;
  }) {
    let query = supabase
      .from('events')
      .select(`
        *,
        organiser:users!events_organiser_id_fkey(id, name, image, verified)
      `)
      .eq('status', 'published')
      .order('date', { ascending: true });

    if (params?.category) {
      query = query.eq('category', params.category);
    }

    if (params?.limit) {
      query = query.limit(params.limit);
    }

    if (params?.offset) {
      query = query.range(params.offset, (params.offset + (params.limit || 10)) - 1);
    }

    const { data, error } = await query;

    if (error) handleSupabaseError(error);
    return data;
  },

  // Get user tickets
  async getUserTickets(userId: string) {
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        *,
        event:events(*)
      `)
      .eq('owner_id', userId)
      .order('purchase_date', { ascending: false });

    if (error) handleSupabaseError(error);
    return data;
  },

  // Create event
  async createEvent(eventData: Inserts<'events'>) {
    const { data, error } = await supabase
      .from('events')
      .insert(eventData)
      .select()
      .single();

    if (error) handleSupabaseError(error);
    return data;
  },

  // Purchase ticket
  async purchaseTicket(ticketData: Inserts<'tickets'>) {
    const { data, error } = await supabase
      .from('tickets')
      .insert(ticketData)
      .select()
      .single();

    if (error) handleSupabaseError(error);
    return data;
  },

  // Like/unlike event
  async toggleEventLike(eventId: string, userId: string) {
    // Check if already liked
    const { data: existingLike } = await supabase
      .from('event_likes')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .single();

    if (existingLike) {
      // Unlike
      const { error } = await supabase
        .from('event_likes')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', userId);

      if (error) handleSupabaseError(error);
      return false; // Unliked
    } else {
      // Like
      const { error } = await supabase
        .from('event_likes')
        .insert({ event_id: eventId, user_id: userId });

      if (error) handleSupabaseError(error);
      return true; // Liked
    }
  },

  // Save/unsave event
  async toggleSavedEvent(eventId: string, userId: string) {
    const { data: existingSave } = await supabase
      .from('saved_events')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .single();

    if (existingSave) {
      // Unsave
      const { error } = await supabase
        .from('saved_events')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', userId);

      if (error) handleSupabaseError(error);
      return false; // Unsaved
    } else {
      // Save
      const { error } = await supabase
        .from('saved_events')
        .insert({ event_id: eventId, user_id: userId });

      if (error) handleSupabaseError(error);
      return true; // Saved
    }
  },

  // Search events
  async searchEvents(query: string, filters?: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    startDate?: string;
    endDate?: string;
  }) {
    let supabaseQuery = supabase
      .from('events')
      .select(`
        *,
        organiser:users!events_organiser_id_fkey(id, name, image, verified)
      `)
      .eq('status', 'published')
      .textSearch('title', query, { type: 'websearch' });

    if (filters?.category) {
      supabaseQuery = supabaseQuery.eq('category', filters.category);
    }

    if (filters?.startDate) {
      supabaseQuery = supabaseQuery.gte('date', filters.startDate);
    }

    if (filters?.endDate) {
      supabaseQuery = supabaseQuery.lte('date', filters.endDate);
    }

    const { data, error } = await supabaseQuery;

    if (error) handleSupabaseError(error);
    return data;
  }
};
