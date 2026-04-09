#!/usr/bin/env node

// UNO Online - Setup Validation Script
console.log('🎮 UNO Online - Setup Validation');
console.log('=================================');

// Check Node.js
console.log('📦 Checking Node.js...');
const nodeVersion = process.version;
console.log(`✅ Node.js installed: ${nodeVersion}`);

// Check if .env.local exists
console.log('🔧 Checking environment configuration...');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
    console.log('✅ .env.local found');

    const envContent = fs.readFileSync(envPath, 'utf8');

    // Check if Supabase URL is configured
    if (envContent.includes('YOUR_PROJECT_SLUG')) {
        console.log('⚠️  .env.local has placeholder values. Please update with your Supabase credentials');
    } else {
        console.log('✅ .env.local appears to be configured');

        // Extract Supabase URL for display
        const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
        if (urlMatch && urlMatch[1] && !urlMatch[1].includes('YOUR_PROJECT_SLUG')) {
            console.log(`🌐 Supabase URL: ${urlMatch[1]}`);
        }
    }
} else {
    console.log('❌ .env.local not found. Please copy .env.example to .env.local and configure');
    process.exit(1);
}

// Check if dependencies are installed
console.log('📦 Checking dependencies...');
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
    console.log('✅ node_modules found');
} else {
    console.log('❌ node_modules not found. Run \'npm install\'');
    process.exit(1);
}

console.log('');
console.log('🎯 Next Steps:');
console.log('1. Create a Supabase project at https://supabase.com');
console.log('2. Update .env.local with your project credentials');
console.log('3. Run the SQL migration in supabase/migrations/001_initial_schema.sql');
console.log('4. Run \'npm run dev\' to start development');
console.log('');
console.log('🚀 Ready to build UNO Online!');