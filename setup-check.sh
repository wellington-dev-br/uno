#!/bin/bash

# UNO Online - Setup Validation Script
echo "🎮 UNO Online - Setup Validation"
echo "================================="

# Check Node.js
echo "📦 Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js installed: $NODE_VERSION"
else
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi

# Check npm
echo "📦 Checking npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo "✅ npm installed: $NPM_VERSION"
else
    echo "❌ npm not found"
    exit 1
fi

# Check if .env.local exists
echo "🔧 Checking environment configuration..."
if [ -f ".env.local" ]; then
    echo "✅ .env.local found"

    # Check if Supabase URL is configured
    if grep -q "YOUR_PROJECT_SLUG" .env.local; then
        echo "⚠️  .env.local has placeholder values. Please update with your Supabase credentials"
    else
        echo "✅ .env.local appears to be configured"
    fi
else
    echo "❌ .env.local not found. Please copy .env.example to .env.local and configure"
    exit 1
fi

# Check if dependencies are installed
echo "📦 Checking dependencies..."
if [ -d "node_modules" ]; then
    echo "✅ node_modules found"
else
    echo "❌ node_modules not found. Run 'npm install'"
    exit 1
fi

# Check if Supabase project is accessible
echo "🔗 Checking Supabase connection..."
if grep -q "supabase.co" .env.local; then
    SUPABASE_URL=$(grep "NEXT_PUBLIC_SUPABASE_URL" .env.local | cut -d '=' -f2)
    SUPABASE_KEY=$(grep "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.local | cut -d '=' -f2)

    if [ "$SUPABASE_URL" != "https://YOUR_PROJECT_SLUG.supabase.co" ] && [ "$SUPABASE_KEY" != "YOUR_ANON_KEY" ]; then
        echo "✅ Supabase credentials configured"
        echo "🌐 Supabase URL: $SUPABASE_URL"
    else
        echo "⚠️  Supabase credentials not configured properly"
    fi
else
    echo "❌ Supabase URL not found in .env.local"
fi

echo ""
echo "🎯 Next Steps:"
echo "1. Create a Supabase project at https://supabase.com"
echo "2. Update .env.local with your project credentials"
echo "3. Run the SQL migration in supabase/migrations/001_initial_schema.sql"
echo "4. Run 'npm run dev' to start development"
echo ""
echo "🚀 Ready to build UNO Online!"