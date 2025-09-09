#!/bin/bash

# Rovify Setup Script
# This script automates the initial setup process

echo "🚀 Starting Rovify Setup..."

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ required. Current version: $(node -v)"
    exit 1
fi

# Check if yarn is installed
if ! command -v yarn &> /dev/null; then
    echo "📦 Installing Yarn..."
    npm install -g yarn
fi

# Install dependencies
echo "📦 Installing dependencies..."
yarn install

# Create environment file if it doesn't exist
if [ ! -f .env.local ]; then
    echo "🔧 Creating .env.local from template..."
    cp .env.example .env.local
    echo "⚠️  Please update .env.local with your configuration"
fi

# Check for Supabase CLI
if ! command -v supabase &> /dev/null; then
    echo "📦 Installing Supabase CLI..."
    npm install -g supabase
fi

# Create necessary directories
echo "📁 Creating project directories..."
mkdir -p contracts
mkdir -p migrations
mkdir -p scripts
mkdir -p lib
mkdir -p public/uploads

# Generate JWT secret if not exists
if ! grep -q "JWT_SECRET=" .env.local || [ -z "$(grep JWT_SECRET= .env.local | cut -d'=' -f2)" ]; then
    echo "🔐 Generating JWT secret..."
    JWT_SECRET=$(openssl rand -base64 32)
    if grep -q "JWT_SECRET=" .env.local; then
        sed -i.bak "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env.local
    else
        echo "JWT_SECRET=$JWT_SECRET" >> .env.local
    fi
fi

# Generate NextAuth secret if not exists
if ! grep -q "NEXTAUTH_SECRET=" .env.local || [ -z "$(grep NEXTAUTH_SECRET= .env.local | cut -d'=' -f2)" ]; then
    echo "🔐 Generating NextAuth secret..."
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    if grep -q "NEXTAUTH_SECRET=" .env.local; then
        sed -i.bak "s/NEXTAUTH_SECRET=.*/NEXTAUTH_SECRET=$NEXTAUTH_SECRET/" .env.local
    else
        echo "NEXTAUTH_SECRET=$NEXTAUTH_SECRET" >> .env.local
    fi
fi

# Database setup prompt
echo ""
echo "📊 Database Setup Options:"
echo "1) Use Supabase (Recommended for quick start)"
echo "2) Use local PostgreSQL"
echo "3) Skip database setup"
read -p "Choose option (1-3): " db_choice

case $db_choice in
    1)
        echo "🔗 Setting up Supabase..."
        echo "Please visit https://app.supabase.com to create a project"
        read -p "Enter your Supabase URL: " SUPABASE_URL
        read -p "Enter your Supabase Anon Key: " SUPABASE_ANON_KEY
        
        # Update .env.local
        sed -i.bak "s|SUPABASE_URL=.*|SUPABASE_URL=$SUPABASE_URL|" .env.local
        sed -i.bak "s|SUPABASE_ANON_KEY=.*|SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY|" .env.local
        
        echo "✅ Supabase configured"
        ;;
    2)
        echo "🐘 Setting up local PostgreSQL..."
        read -p "Enter PostgreSQL connection string: " DATABASE_URL
        sed -i.bak "s|DATABASE_URL=.*|DATABASE_URL=$DATABASE_URL|" .env.local
        echo "✅ PostgreSQL configured"
        ;;
    3)
        echo "⏭️  Skipping database setup"
        ;;
esac

# Smart contract setup prompt
echo ""
read -p "Do you want to set up Scaffold-ETH for smart contracts? (y/n): " setup_contracts

if [ "$setup_contracts" = "y" ]; then
    echo "📝 Setting up Scaffold-ETH..."
    cd contracts
    npx create-eth@latest . --skip-git
    cd ..
    echo "✅ Scaffold-ETH initialized in ./contracts"
    echo "⚠️  Remember to deploy contracts and update NFT_CONTRACT_ADDRESS in .env.local"
fi

# Create initial migration file
echo "📝 Creating initial database migration..."
cat > migrations/001_initial_schema.sql << 'EOF'
-- Initial Rovify Database Schema

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address TEXT UNIQUE,
    email TEXT UNIQUE,
    name TEXT,
    bio TEXT,
    image TEXT,
    auth_method TEXT NOT NULL,
    is_organiser BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    image TEXT,
    date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    location JSONB NOT NULL,
    organiser_id UUID REFERENCES users(id),
    category TEXT,
    subcategory TEXT,
    price JSONB,
    has_nft_tickets BOOLEAN DEFAULT false,
    total_tickets INTEGER,
    sold_tickets INTEGER DEFAULT 0,
    tags TEXT[],
    contract_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id),
    owner_id UUID REFERENCES users(id),
    type TEXT NOT NULL,
    price DECIMAL,
    currency TEXT DEFAULT 'USD',
    purchase_date TIMESTAMPTZ DEFAULT NOW(),
    is_nft BOOLEAN DEFAULT false,
    token_id TEXT UNIQUE,
    contract_address TEXT,
    transferable BOOLEAN DEFAULT true,
    status TEXT DEFAULT 'ACTIVE',
    seat_info JSONB,
    qr_code TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_tickets_owner ON tickets(owner_id);
CREATE INDEX idx_tickets_event ON tickets(event_id);
EOF

echo "✅ Migration file created at migrations/001_initial_schema.sql"

# Build check
echo ""
echo "🔨 Running build check..."
yarn build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed. Please check for errors."
    exit 1
fi

# Final instructions
echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env.local with your configuration"
echo "2. Run database migrations (if using Supabase: supabase db push)"
echo "3. Deploy smart contracts (if applicable)"
echo "4. Start development server: yarn dev"
echo ""
echo "📚 Check IMPLEMENTATION_GUIDE.md for detailed instructions"
echo "🚀 Check QUICK_START.md for rapid deployment"
