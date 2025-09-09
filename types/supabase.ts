export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          wallet_address: string | null
          email: string | null
          username: string | null
          name: string | null
          bio: string | null
          image: string | null
          auth_method: 'email' | 'google' | 'metamask' | 'base'
          is_organiser: boolean
          is_admin: boolean
          email_verified: boolean
          password_hash: string | null
          followers_count: number
          following_count: number
          twitter: string | null
          instagram: string | null
          website: string | null
          preferences: Json
          interests: string[] | null
          saved_events: string[] | null
          attended_events: string[] | null
          created_events: string[] | null
          verified: boolean
          base_name: string | null
          ens_name: string | null
          created_at: string
          updated_at: string
          last_login_at: string | null
        }
        Insert: {
          id?: string
          wallet_address?: string | null
          email?: string | null
          username?: string | null
          name?: string | null
          bio?: string | null
          image?: string | null
          auth_method: 'email' | 'google' | 'metamask' | 'base'
          is_organiser?: boolean
          is_admin?: boolean
          email_verified?: boolean
          password_hash?: string | null
          followers_count?: number
          following_count?: number
          twitter?: string | null
          instagram?: string | null
          website?: string | null
          preferences?: Json
          interests?: string[] | null
          saved_events?: string[] | null
          attended_events?: string[] | null
          created_events?: string[] | null
          verified?: boolean
          base_name?: string | null
          ens_name?: string | null
          created_at?: string
          updated_at?: string
          last_login_at?: string | null
        }
        Update: {
          id?: string
          wallet_address?: string | null
          email?: string | null
          username?: string | null
          name?: string | null
          bio?: string | null
          image?: string | null
          auth_method?: 'email' | 'google' | 'metamask' | 'base'
          is_organiser?: boolean
          is_admin?: boolean
          email_verified?: boolean
          password_hash?: string | null
          followers_count?: number
          following_count?: number
          twitter?: string | null
          instagram?: string | null
          website?: string | null
          preferences?: Json
          interests?: string[] | null
          saved_events?: string[] | null
          attended_events?: string[] | null
          created_events?: string[] | null
          verified?: boolean
          base_name?: string | null
          ens_name?: string | null
          created_at?: string
          updated_at?: string
          last_login_at?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          id: string
          title: string
          description: string | null
          image: string | null
          date: string
          end_date: string | null
          location: Json
          venue_capacity: number | null
          organiser_id: string | null
          category: string | null
          subcategory: string | null
          tags: string[] | null
          price: Json | null
          has_nft_tickets: boolean
          contract_address: string | null
          contract_event_id: number | null
          total_tickets: number | null
          sold_tickets: number
          max_tickets_per_user: number
          status: 'draft' | 'published' | 'cancelled' | 'completed'
          is_featured: boolean
          likes: number
          views: number
          shares: number
          created_at: string
          updated_at: string
          published_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          image?: string | null
          date: string
          end_date?: string | null
          location: Json
          venue_capacity?: number | null
          organiser_id?: string | null
          category?: string | null
          subcategory?: string | null
          tags?: string[] | null
          price?: Json | null
          has_nft_tickets?: boolean
          contract_address?: string | null
          contract_event_id?: number | null
          total_tickets?: number | null
          sold_tickets?: number
          max_tickets_per_user?: number
          status?: 'draft' | 'published' | 'cancelled' | 'completed'
          is_featured?: boolean
          likes?: number
          views?: number
          shares?: number
          created_at?: string
          updated_at?: string
          published_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          image?: string | null
          date?: string
          end_date?: string | null
          location?: Json
          venue_capacity?: number | null
          organiser_id?: string | null
          category?: string | null
          subcategory?: string | null
          tags?: string[] | null
          price?: Json | null
          has_nft_tickets?: boolean
          contract_address?: string | null
          contract_event_id?: number | null
          total_tickets?: number | null
          sold_tickets?: number
          max_tickets_per_user?: number
          status?: 'draft' | 'published' | 'cancelled' | 'completed'
          is_featured?: boolean
          likes?: number
          views?: number
          shares?: number
          created_at?: string
          updated_at?: string
          published_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_organiser_id_fkey"
            columns: ["organiser_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      tickets: {
        Row: {
          id: string
          event_id: string | null
          owner_id: string | null
          type: string
          tier_name: string | null
          price: number | null
          currency: string
          is_nft: boolean
          token_id: string | null
          contract_address: string | null
          transferable: boolean
          status: 'ACTIVE' | 'USED' | 'EXPIRED' | 'TRANSFERRED' | 'CANCELLED'
          seat_info: Json | null
          qr_code: string | null
          verification_code: string | null
          metadata: Json | null
          used_at: string | null
          checked_in_by: string | null
          purchase_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id?: string | null
          owner_id?: string | null
          type: string
          tier_name?: string | null
          price?: number | null
          currency?: string
          is_nft?: boolean
          token_id?: string | null
          contract_address?: string | null
          transferable?: boolean
          status?: 'ACTIVE' | 'USED' | 'EXPIRED' | 'TRANSFERRED' | 'CANCELLED'
          seat_info?: Json | null
          qr_code?: string | null
          verification_code?: string | null
          metadata?: Json | null
          used_at?: string | null
          checked_in_by?: string | null
          purchase_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string | null
          owner_id?: string | null
          type?: string
          tier_name?: string | null
          price?: number | null
          currency?: string
          is_nft?: boolean
          token_id?: string | null
          contract_address?: string | null
          transferable?: boolean
          status?: 'ACTIVE' | 'USED' | 'EXPIRED' | 'TRANSFERRED' | 'CANCELLED'
          seat_info?: Json | null
          qr_code?: string | null
          verification_code?: string | null
          metadata?: Json | null
          used_at?: string | null
          checked_in_by?: string | null
          purchase_date?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_event_id_fkey"
            columns: ["event_id"]
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_owner_id_fkey"
            columns: ["owner_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_checked_in_by_fkey"
            columns: ["checked_in_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      transactions: {
        Row: {
          id: string
          user_id: string | null
          ticket_id: string | null
          event_id: string | null
          type: 'purchase' | 'transfer' | 'refund' | 'payout'
          amount: number | null
          currency: string
          payment_method: string | null
          payment_id: string | null
          transaction_hash: string | null
          block_number: number | null
          gas_used: string | null
          status: 'pending' | 'completed' | 'failed' | 'refunded'
          metadata: Json | null
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          ticket_id?: string | null
          event_id?: string | null
          type: 'purchase' | 'transfer' | 'refund' | 'payout'
          amount?: number | null
          currency?: string
          payment_method?: string | null
          payment_id?: string | null
          transaction_hash?: string | null
          block_number?: number | null
          gas_used?: string | null
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
          metadata?: Json | null
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          ticket_id?: string | null
          event_id?: string | null
          type?: 'purchase' | 'transfer' | 'refund' | 'payout'
          amount?: number | null
          currency?: string
          payment_method?: string | null
          payment_id?: string | null
          transaction_hash?: string | null
          block_number?: number | null
          gas_used?: string | null
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
          metadata?: Json | null
          created_at?: string
          completed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_ticket_id_fkey"
            columns: ["ticket_id"]
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_event_id_fkey"
            columns: ["event_id"]
            referencedRelation: "events"
            referencedColumns: ["id"]
          }
        ]
      }
      messages: {
        Row: {
          id: string
          event_id: string | null
          sender_id: string | null
          content: string
          type: 'text' | 'image' | 'system'
          reply_to_id: string | null
          edited: boolean
          deleted: boolean
          metadata: Json | null
          created_at: string
          edited_at: string | null
        }
        Insert: {
          id?: string
          event_id?: string | null
          sender_id?: string | null
          content: string
          type?: 'text' | 'image' | 'system'
          reply_to_id?: string | null
          edited?: boolean
          deleted?: boolean
          metadata?: Json | null
          created_at?: string
          edited_at?: string | null
        }
        Update: {
          id?: string
          event_id?: string | null
          sender_id?: string | null
          content?: string
          type?: 'text' | 'image' | 'system'
          reply_to_id?: string | null
          edited?: boolean
          deleted?: boolean
          metadata?: Json | null
          created_at?: string
          edited_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_event_id_fkey"
            columns: ["event_id"]
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            referencedRelation: "messages"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string | null
          type: string
          title: string
          message: string | null
          reference_type: string | null
          reference_id: string | null
          read: boolean
          action_url: string | null
          action_text: string | null
          created_at: string
          read_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          type: string
          title: string
          message?: string | null
          reference_type?: string | null
          reference_id?: string | null
          read?: boolean
          action_url?: string | null
          action_text?: string | null
          created_at?: string
          read_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          type?: string
          title?: string
          message?: string | null
          reference_type?: string | null
          reference_id?: string | null
          read?: boolean
          action_url?: string | null
          action_text?: string | null
          created_at?: string
          read_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      follows: {
        Row: {
          id: string
          follower_id: string | null
          following_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          follower_id?: string | null
          following_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          follower_id?: string | null
          following_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      event_attendees: {
        Row: {
          id: string
          event_id: string | null
          user_id: string | null
          status: 'interested' | 'going' | 'attended'
          created_at: string
        }
        Insert: {
          id?: string
          event_id?: string | null
          user_id?: string | null
          status?: 'interested' | 'going' | 'attended'
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string | null
          user_id?: string | null
          status?: 'interested' | 'going' | 'attended'
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_attendees_event_id_fkey"
            columns: ["event_id"]
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_attendees_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      reviews: {
        Row: {
          id: string
          event_id: string | null
          user_id: string | null
          rating: number | null
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_id?: string | null
          user_id?: string | null
          rating?: number | null
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string | null
          user_id?: string | null
          rating?: number | null
          comment?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_event_id_fkey"
            columns: ["event_id"]
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      event_likes: {
        Row: {
          id: string
          event_id: string | null
          user_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_id?: string | null
          user_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string | null
          user_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_likes_event_id_fkey"
            columns: ["event_id"]
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_likes_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      event_shares: {
        Row: {
          id: string
          event_id: string | null
          user_id: string | null
          platform: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_id?: string | null
          user_id?: string | null
          platform?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string | null
          user_id?: string | null
          platform?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_shares_event_id_fkey"
            columns: ["event_id"]
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_shares_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      saved_events: {
        Row: {
          id: string
          event_id: string | null
          user_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_id?: string | null
          user_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string | null
          user_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_events_event_id_fkey"
            columns: ["event_id"]
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_events_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      payment_methods: {
        Row: {
          id: string
          user_id: string | null
          type: 'card' | 'bank' | 'crypto_wallet' | null
          provider: string | null
          provider_id: string | null
          is_default: boolean
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          type?: 'card' | 'bank' | 'crypto_wallet' | null
          provider?: string | null
          provider_id?: string | null
          is_default?: boolean
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          type?: 'card' | 'bank' | 'crypto_wallet' | null
          provider?: string | null
          provider_id?: string | null
          is_default?: boolean
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      analytics_events: {
        Row: {
          id: string
          event_type: string
          user_id: string | null
          session_id: string | null
          event_data: Json | null
          ip_address: string | null
          user_agent: string | null
          referrer: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_type: string
          user_id?: string | null
          session_id?: string | null
          event_data?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          referrer?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          event_type?: string
          user_id?: string | null
          session_id?: string | null
          event_data?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          referrer?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
