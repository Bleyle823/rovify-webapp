// API client for fetching data from Supabase via API routes
import { supabase } from './supabase';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  total?: number;
  limit?: number;
  offset?: number;
}

export interface EventFilters {
  category?: string;
  limit?: number;
  offset?: number;
  search?: string;
  organiser_id?: string;
  status?: string;
  has_nft_tickets?: boolean;
}

export interface UserFilters {
  limit?: number;
  offset?: number;
  search?: string;
  role?: 'organiser' | 'admin';
  verified?: boolean;
}

// Events API
export const eventsApi = {
  async getAll(filters?: EventFilters) {
    try {
      const params = new URLSearchParams();
      if (filters?.category) params.append('category', filters.category);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.offset) params.append('offset', filters.offset.toString());
      if (filters?.search) params.append('search', filters.search);
      if (filters?.organiser_id) params.append('organiser_id', filters.organiser_id);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.has_nft_tickets !== undefined) params.append('has_nft_tickets', filters.has_nft_tickets.toString());

      const response = await fetch(`/api/events?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      
      const result = await response.json();
      return {
        data: result.events,
        total: result.total,
        limit: result.limit,
        offset: result.offset,
      };
    } catch (error) {
      console.error('Events API error:', error);
      return { error: error instanceof Error ? error.message : 'Failed to fetch events' };
    }
  },

  async getById(id: string) {
    try {
      const { data, error } = await supabase
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
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return { data };
    } catch (error) {
      console.error('Event by ID error:', error);
      return { error: error instanceof Error ? error.message : 'Failed to fetch event' };
    }
  },

  async create(eventData: any) {
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create event');
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('Create event error:', error);
      return { error: error instanceof Error ? error.message : 'Failed to create event' };
    }
  },
};

// Users API
export const usersApi = {
  async getAll(filters?: UserFilters) {
    try {
      const params = new URLSearchParams();
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.offset) params.append('offset', filters.offset.toString());
      if (filters?.search) params.append('search', filters.search);
      if (filters?.role) params.append('role', filters.role);
      if (filters?.verified !== undefined) params.append('verified', filters.verified.toString());

      const response = await fetch(`/api/users?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const result = await response.json();
      return {
        data: result.users,
        total: result.total,
        limit: result.limit,
        offset: result.offset,
      };
    } catch (error) {
      console.error('Users API error:', error);
      return { error: error instanceof Error ? error.message : 'Failed to fetch users' };
    }
  },

  async getById(id: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { data };
    } catch (error) {
      console.error('User by ID error:', error);
      return { error: error instanceof Error ? error.message : 'Failed to fetch user' };
    }
  },
};

// Tickets API
export const ticketsApi = {
  async getUserTickets(status?: string, eventId?: string) {
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (eventId) params.append('event_id', eventId);

      const response = await fetch(`/api/tickets?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch tickets');
      }
      
      const result = await response.json();
      return { data: result.tickets };
    } catch (error) {
      console.error('Tickets API error:', error);
      return { error: error instanceof Error ? error.message : 'Failed to fetch tickets' };
    }
  },

  async purchase(ticketData: {
    event_id: string;
    type: string;
    tier_name?: string;
    payment_method: 'stripe' | 'crypto';
    payment_id?: string;
    seat_info?: any;
  }) {
    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to purchase ticket');
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('Purchase ticket error:', error);
      return { error: error instanceof Error ? error.message : 'Failed to purchase ticket' };
    }
  },
};

// Direct Supabase queries for real-time data
export const realtimeApi = {
  // Get events with real-time updates
  subscribeToEvents(callback: (events: any[]) => void) {
    return supabase
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
      .eq('status', 'published')
      .order('date', { ascending: true })
      .on('*', (payload) => {
        console.log('Real-time event update:', payload);
        // Re-fetch data and call callback
        eventsApi.getAll().then((result) => {
          if (result.data) {
            callback(result.data);
          }
        });
      })
      .subscribe();
  },

  // Get user's tickets with real-time updates
  subscribeToUserTickets(userId: string, callback: (tickets: any[]) => void) {
    return supabase
      .from('tickets')
      .select(`
        *,
        event:events(*)
      `)
      .eq('owner_id', userId)
      .on('*', (payload) => {
        console.log('Real-time ticket update:', payload);
        // Re-fetch data and call callback
        ticketsApi.getUserTickets().then((result) => {
          if (result.data) {
            callback(result.data);
          }
        });
      })
      .subscribe();
  },
};
