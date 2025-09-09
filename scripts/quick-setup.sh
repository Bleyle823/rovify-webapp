#!/bin/bash

# 🚀 Rovify Quick Setup Script
# This script helps you get the Rovify backend up and running quickly

echo "🎉 Welcome to Rovify Backend Setup!"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if Yarn is installed
if ! command -v yarn &> /dev/null; then
    print_error "Yarn is not installed. Please install Yarn first."
    exit 1
fi

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    print_warning "Supabase CLI is not installed."
    read -p "Would you like to install it now? (y/n): " install_supabase
    if [[ $install_supabase == "y" || $install_supabase == "Y" ]]; then
        npm install -g supabase
        print_success "Supabase CLI installed!"
    else
        print_error "Supabase CLI is required. Please install it manually: npm install -g supabase"
        exit 1
    fi
fi

print_status "Installing dependencies..."
yarn install

if [ $? -eq 0 ]; then
    print_success "Dependencies installed successfully!"
else
    print_error "Failed to install dependencies. Please check your network connection."
    exit 1
fi

# Check if .env.local exists
if [ ! -f .env.local ]; then
    print_warning ".env.local not found. Creating from template..."
    cp ENV_TEMPLATE.txt .env.local
    print_success ".env.local created!"
    print_warning "⚠️  IMPORTANT: Please edit .env.local with your actual Supabase credentials before proceeding."
    echo ""
    echo "Required variables to update:"
    echo "- SUPABASE_URL"
    echo "- SUPABASE_ANON_KEY"
    echo "- SUPABASE_SERVICE_KEY"
    echo "- NEXT_PUBLIC_SUPABASE_URL"
    echo "- NEXT_PUBLIC_SUPABASE_ANON_KEY"
    echo "- NEXTAUTH_SECRET"
    echo ""
    read -p "Press Enter after you've updated .env.local..."
else
    print_success ".env.local already exists!"
fi

# Ask about Supabase setup
echo ""
print_status "Setting up Supabase..."
read -p "Do you want to set up a local Supabase instance? (y/n): " setup_local

if [[ $setup_local == "y" || $setup_local == "Y" ]]; then
    print_status "Initializing local Supabase..."
    supabase init
    
    print_status "Starting local Supabase services..."
    supabase start
    
    if [ $? -eq 0 ]; then
        print_success "Local Supabase started successfully!"
        print_status "Updating .env.local with local Supabase credentials..."
        
        # Get local Supabase credentials
        LOCAL_URL=$(supabase status | grep "API URL" | awk '{print $3}')
        LOCAL_ANON_KEY=$(supabase status | grep "anon key" | awk '{print $3}')
        LOCAL_SERVICE_KEY=$(supabase status | grep "service_role key" | awk '{print $3}')
        
        # Update .env.local with local credentials
        sed -i.bak "s|SUPABASE_URL=.*|SUPABASE_URL=$LOCAL_URL|g" .env.local
        sed -i.bak "s|SUPABASE_ANON_KEY=.*|SUPABASE_ANON_KEY=$LOCAL_ANON_KEY|g" .env.local
        sed -i.bak "s|SUPABASE_SERVICE_KEY=.*|SUPABASE_SERVICE_KEY=$LOCAL_SERVICE_KEY|g" .env.local
        sed -i.bak "s|NEXT_PUBLIC_SUPABASE_URL=.*|NEXT_PUBLIC_SUPABASE_URL=$LOCAL_URL|g" .env.local
        sed -i.bak "s|NEXT_PUBLIC_SUPABASE_ANON_KEY=.*|NEXT_PUBLIC_SUPABASE_ANON_KEY=$LOCAL_ANON_KEY|g" .env.local
        
        rm .env.local.bak
        print_success "Environment variables updated for local Supabase!"
    else
        print_error "Failed to start local Supabase. Please check the logs."
        exit 1
    fi
else
    print_warning "Using remote Supabase. Make sure your .env.local has the correct credentials."
fi

# Apply database migration
echo ""
print_status "Applying database migration..."
if [[ $setup_local == "y" || $setup_local == "Y" ]]; then
    supabase migration up
else
    supabase db push
fi

if [ $? -eq 0 ]; then
    print_success "Database migration applied successfully!"
else
    print_error "Failed to apply database migration. Please check your Supabase connection."
    exit 1
fi

# Ask about seeding database
echo ""
read -p "Would you like to seed the database with sample data? (y/n): " seed_db

if [[ $seed_db == "y" || $seed_db == "Y" ]]; then
    print_status "Seeding database with sample data..."
    yarn db:seed
    
    if [ $? -eq 0 ]; then
        print_success "Database seeded successfully!"
        echo ""
        echo "🔑 Demo Credentials:"
        echo "Email: alex.rivera@example.com"
        echo "Password: password123"
        echo ""
        echo "🔑 Admin Credentials:"
        echo "Email: admin@rovify.io"
        echo "Password: admin123"
    else
        print_error "Failed to seed database. You can try again later with: yarn db:seed"
    fi
fi

# Generate NextAuth secret if not set
if grep -q "NEXTAUTH_SECRET=your-nextauth-secret-key" .env.local; then
    print_status "Generating NextAuth secret..."
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    sed -i.bak "s|NEXTAUTH_SECRET=your-nextauth-secret-key|NEXTAUTH_SECRET=$NEXTAUTH_SECRET|g" .env.local
    rm .env.local.bak
    print_success "NextAuth secret generated!"
fi

echo ""
print_success "🎉 Setup completed successfully!"
echo ""
echo "📋 Next Steps:"
echo "1. Start the development server: yarn dev"
echo "2. Open your browser to: http://localhost:3000"
echo "3. Test the authentication with demo credentials"
echo "4. Explore the API endpoints at: http://localhost:3000/api/*"
echo ""
echo "📚 Useful Commands:"
echo "- yarn dev                 # Start development server"
echo "- yarn db:seed            # Reseed database"
echo "- supabase dashboard      # Open Supabase dashboard"
echo "- supabase status         # Check Supabase status"
echo ""
echo "📖 For detailed testing instructions, see: TESTING_GUIDE.md"
echo ""
print_success "Happy coding! 🚀"
