-- Rovify Database Schema
-- PostgreSQL/Supabase compatible
-- Run this migration to set up your initial database structure

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address TEXT UNIQUE,
    email TEXT UNIQUE,
    username TEXT UNIQUE,
    name TEXT,
    bio TEXT,
    image TEXT,
    auth_method TEXT NOT NULL CHECK (auth_method IN ('email', 'google', 'metamask', 'base')),
    is_organiser BOOLEAN DEFAULT false,
    is_admin BOOLEAN DEFAULT false,
    email_verified BOOLEAN DEFAULT false,
    password_hash TEXT, -- For email auth
    
    -- Social metrics
    followers_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    
    -- Social links
    twitter TEXT,
    instagram TEXT,
    website TEXT,
    
    -- User preferences
    preferences JSONB DEFAULT '{
        "notifications": true, 
        "newsletter": true,
        "notificationTypes": ["REMINDER", "FRIEND_GOING", "NEW_EVENT"],
        "locationRadius": 25,
        "currency": "USD"
    }',
    
    -- Profile data
    interests TEXT[],
    saved_events UUID[],
    attended_events UUID[],
    created_events UUID[],
    verified BOOLEAN DEFAULT false,
    
    -- Base wallet specific
    base_name TEXT,
    ens_name TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

-- ============================================
-- EVENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    image TEXT,
    date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    
    -- Location data
    location JSONB NOT NULL, -- {name, address, city, coordinates: {lat, lng}}
    venue_capacity INTEGER,
    
    -- Organizer
    organiser_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Categorization
    category TEXT,
    subcategory TEXT,
    tags TEXT[],
    
    -- Pricing
    price JSONB, -- {min, max, currency, tiers: [{name, price, benefits}]}
    
    -- NFT/Blockchain
    has_nft_tickets BOOLEAN DEFAULT false,
    contract_address TEXT,
    contract_event_id INTEGER, -- On-chain event ID
    
    -- Ticket info
    total_tickets INTEGER,
    sold_tickets INTEGER DEFAULT 0,
    max_tickets_per_user INTEGER DEFAULT 10,
    
    -- Status
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),
    is_featured BOOLEAN DEFAULT false,
    
    -- Social metrics
    likes INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ
);

-- ============================================
-- TICKETS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Ticket details
    type TEXT NOT NULL, -- VIP, GENERAL, EARLY_BIRD, etc.
    tier_name TEXT,
    price DECIMAL(10, 2),
    currency TEXT DEFAULT 'USD',
    
    -- NFT details
    is_nft BOOLEAN DEFAULT false,
    token_id TEXT UNIQUE,
    contract_address TEXT,
    transferable BOOLEAN DEFAULT true,
    
    -- Status
    status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'USED', 'EXPIRED', 'TRANSFERRED', 'CANCELLED')),
    
    -- Seat/slot info
    seat_info JSONB, -- {section, row, seat, timeSlot}
    
    -- Verification
    qr_code TEXT UNIQUE,
    verification_code TEXT UNIQUE,
    
    -- Metadata
    metadata JSONB, -- {issuer, edition, perks, originalPrice, etc.}
    
    -- Usage tracking
    used_at TIMESTAMPTZ,
    checked_in_by UUID REFERENCES users(id),
    
    -- Timestamps
    purchase_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TRANSACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    
    -- Transaction details
    type TEXT NOT NULL CHECK (type IN ('purchase', 'transfer', 'refund', 'payout')),
    amount DECIMAL(10, 2),
    currency TEXT DEFAULT 'USD',
    
    -- Payment method
    payment_method TEXT, -- stripe, crypto, etc.
    payment_id TEXT, -- Stripe payment ID or transaction hash
    
    -- Blockchain details
    transaction_hash TEXT,
    block_number INTEGER,
    gas_used TEXT,
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    
    -- Metadata
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- ============================================
-- MESSAGES TABLE (for event chat)
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Message content
    content TEXT NOT NULL,
    type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image', 'system')),
    
    -- Reply threading
    reply_to_id UUID REFERENCES messages(id),
    
    -- Status
    edited BOOLEAN DEFAULT false,
    deleted BOOLEAN DEFAULT false,
    
    -- Metadata
    metadata JSONB, -- {reactions, mentions, attachments}
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    edited_at TIMESTAMPTZ
);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Notification details
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    
    -- Reference
    reference_type TEXT, -- event, ticket, message, etc.
    reference_id UUID,
    
    -- Status
    read BOOLEAN DEFAULT false,
    
    -- Action
    action_url TEXT,
    action_text TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

-- ============================================
-- FOLLOWS TABLE (user relationships)
-- ============================================
CREATE TABLE IF NOT EXISTS follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(follower_id, following_id)
);

-- ============================================
-- EVENT_ATTENDEES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS event_attendees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'interested' CHECK (status IN ('interested', 'going', 'attended')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(event_id, user_id)
);

-- ============================================
-- REVIEWS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(event_id, user_id)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_organiser ON events(organiser_id);
CREATE INDEX idx_events_status ON events(status);

CREATE INDEX idx_tickets_owner ON tickets(owner_id);
CREATE INDEX idx_tickets_event ON tickets(event_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_token ON tickets(token_id) WHERE token_id IS NOT NULL;

CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_hash ON transactions(transaction_hash) WHERE transaction_hash IS NOT NULL;

CREATE INDEX idx_messages_event ON messages(event_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply auto-update trigger to tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (for Supabase)
-- ============================================

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile and update it
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Public can view published events
CREATE POLICY "Public can view published events" ON events
    FOR SELECT USING (status = 'published');

-- Organizers can manage their own events
CREATE POLICY "Organizers can manage own events" ON events
    FOR ALL USING (auth.uid()::text = organiser_id::text);

-- Users can view their own tickets
CREATE POLICY "Users can view own tickets" ON tickets
    FOR SELECT USING (auth.uid()::text = owner_id::text);

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions" ON transactions
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Users can read messages from events they have tickets for
CREATE POLICY "Users can read event messages" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tickets 
            WHERE tickets.event_id = messages.event_id 
            AND tickets.owner_id::text = auth.uid()::text
        )
    );

-- Users can read their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- ============================================
-- RLS POLICIES FOR NEW TABLES
-- ============================================

-- Enable RLS for new tables
ALTER TABLE event_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Event likes policies
CREATE POLICY "Users can manage their own likes" ON event_likes
    FOR ALL USING (auth.uid()::text = user_id::text);

CREATE POLICY "Public can view event likes" ON event_likes
    FOR SELECT USING (true);

-- Event shares policies
CREATE POLICY "Users can share events" ON event_shares
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Public can view event shares" ON event_shares
    FOR SELECT USING (true);

-- Saved events policies
CREATE POLICY "Users can manage their saved events" ON saved_events
    FOR ALL USING (auth.uid()::text = user_id::text);

-- Payment methods policies
CREATE POLICY "Users can manage their payment methods" ON payment_methods
    FOR ALL USING (auth.uid()::text = user_id::text);

-- Analytics events policies (only for authenticated users)
CREATE POLICY "Users can create analytics events" ON analytics_events
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text OR user_id IS NULL);

-- Follows policies
CREATE POLICY "Users can manage their follows" ON follows
    FOR ALL USING (auth.uid()::text = follower_id::text);

CREATE POLICY "Public can view follows" ON follows
    FOR SELECT USING (true);

-- Event attendees policies
CREATE POLICY "Users can manage their event attendance" ON event_attendees
    FOR ALL USING (auth.uid()::text = user_id::text);

CREATE POLICY "Public can view event attendees" ON event_attendees
    FOR SELECT USING (true);

-- Reviews policies
CREATE POLICY "Users can manage their own reviews" ON reviews
    FOR ALL USING (auth.uid()::text = user_id::text);

CREATE POLICY "Public can view reviews" ON reviews
    FOR SELECT USING (true);

-- ============================================
-- EVENT_LIKES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS event_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(event_id, user_id)
);

-- ============================================
-- EVENT_SHARES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS event_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    platform TEXT, -- twitter, facebook, etc.
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SAVED_EVENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS saved_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(event_id, user_id)
);

-- ============================================
-- PAYMENT_METHODS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('card', 'bank', 'crypto_wallet')),
    provider TEXT, -- stripe, coinbase, etc.
    provider_id TEXT,
    is_default BOOLEAN DEFAULT false,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ANALYTICS EVENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL, -- page_view, click, purchase, etc.
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id TEXT,
    event_data JSONB,
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ADDITIONAL INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_event_likes_event ON event_likes(event_id);
CREATE INDEX idx_event_likes_user ON event_likes(user_id);
CREATE INDEX idx_event_shares_event ON event_shares(event_id);
CREATE INDEX idx_saved_events_user ON saved_events(user_id);
CREATE INDEX idx_saved_events_event ON saved_events(event_id);
CREATE INDEX idx_payment_methods_user ON payment_methods(user_id);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_user ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_created ON analytics_events(created_at);

-- Full text search indexes
CREATE INDEX idx_events_search ON events USING gin(to_tsvector('english', title || ' ' || description || ' ' || array_to_string(tags, ' ')));
CREATE INDEX idx_users_search ON users USING gin(to_tsvector('english', name || ' ' || COALESCE(bio, '') || ' ' || array_to_string(interests, ' ')));

-- ============================================
-- FUNCTIONS FOR BUSINESS LOGIC
-- ============================================

-- Function to update event metrics
CREATE OR REPLACE FUNCTION update_event_metrics()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'event_likes' THEN
        IF TG_OP = 'INSERT' THEN
            UPDATE events SET likes = likes + 1 WHERE id = NEW.event_id;
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE events SET likes = GREATEST(0, likes - 1) WHERE id = OLD.event_id;
        END IF;
    ELSIF TG_TABLE_NAME = 'event_shares' THEN
        IF TG_OP = 'INSERT' THEN
            UPDATE events SET shares = shares + 1 WHERE id = NEW.event_id;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to update user follow counts
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE users SET following_count = following_count + 1 WHERE id = NEW.follower_id;
        UPDATE users SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE users SET following_count = GREATEST(0, following_count - 1) WHERE id = OLD.follower_id;
        UPDATE users SET followers_count = GREATEST(0, followers_count - 1) WHERE id = OLD.following_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to generate unique QR codes
CREATE OR REPLACE FUNCTION generate_qr_code(ticket_id UUID, event_id UUID, ticket_type TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN 'ROVIFY-' || UPPER(LEFT(ticket_id::TEXT, 8)) || '-' || UPPER(LEFT(event_id::TEXT, 8)) || '-' || UPPER(ticket_type);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger for event metrics
CREATE TRIGGER trigger_update_event_likes
    AFTER INSERT OR DELETE ON event_likes
    FOR EACH ROW EXECUTE FUNCTION update_event_metrics();

CREATE TRIGGER trigger_update_event_shares
    AFTER INSERT ON event_shares
    FOR EACH ROW EXECUTE FUNCTION update_event_metrics();

-- Trigger for follow counts
CREATE TRIGGER trigger_update_follow_counts
    AFTER INSERT OR DELETE ON follows
    FOR EACH ROW EXECUTE FUNCTION update_follow_counts();

-- Trigger to auto-generate QR codes for tickets
CREATE OR REPLACE FUNCTION auto_generate_ticket_qr()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.qr_code IS NULL THEN
        NEW.qr_code = generate_qr_code(NEW.id, NEW.event_id, NEW.type);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_generate_ticket_qr
    BEFORE INSERT ON tickets
    FOR EACH ROW EXECUTE FUNCTION auto_generate_ticket_qr();

-- ============================================
-- INITIAL DATA (Optional)
-- ============================================

-- Insert default categories
INSERT INTO events (id, title, description, category, status)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'System Event', 'System placeholder', 'SYSTEM', 'draft')
ON CONFLICT DO NOTHING;

-- Create admin user (update with your details)
-- INSERT INTO users (email, name, auth_method, is_admin)
-- VALUES ('admin@rovify.io', 'Admin', 'email', true)
-- ON CONFLICT DO NOTHING;
