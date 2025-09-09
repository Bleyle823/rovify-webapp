#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const envTemplate = `# Rovify Environment Variables
# Copy from ENV_TEMPLATE.txt and fill in your values

# ===== DATABASE CONFIGURATION =====
# Replace with your actual Supabase project URL and keys
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# ===== AUTHENTICATION =====
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key-here

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# ===== ENVIRONMENT =====
NODE_ENV=development
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ===== FEATURE FLAGS =====
ENABLE_SOCIAL_LOGIN=true
ENABLE_EMAIL_AUTH=true
`;

const envPath = path.join(process.cwd(), '.env.local');

if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, envTemplate);
    console.log('✅ Created .env.local file');
    console.log('📝 Please update the Supabase environment variables with your actual values');
} else {
    console.log('⚠️  .env.local already exists');
    console.log('📝 Please ensure your Supabase environment variables are set correctly');
}

console.log('\n🔧 Setup Instructions:');
console.log('1. Create a Supabase project at https://supabase.com');
console.log('2. Copy your project URL and anon key to .env.local');
console.log('3. Run database migrations: npm run db:migrate');
console.log('4. Start the development server: npm run dev');
