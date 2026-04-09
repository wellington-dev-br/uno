#!/usr/bin/env node

// UNO Online - Database Setup Instructions
const fs = require('fs');
const path = require('path');

console.log('🎮 UNO Online - Database Setup');
console.log('================================');

// Load environment variables manually
function loadEnv() {
  const envPath = path.join(__dirname, '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};

  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      env[key.trim()] = valueParts.join('=').trim();
    }
  });

  return env;
}

const env = loadEnv();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;

console.log('✅ Environment configured');
console.log('🌐 Supabase URL:', SUPABASE_URL);
console.log('');

console.log('📋 MANUAL DATABASE SETUP REQUIRED');
console.log('==================================');
console.log('');
console.log('Since automatic migration failed, please follow these steps:');
console.log('');
console.log('1. Open your Supabase dashboard:');
console.log(`   ${SUPABASE_URL}/project/default/sql`);
console.log('');
console.log('2. Click on "SQL Editor" in the left sidebar');
console.log('');
console.log('3. Copy and paste the following SQL:');
console.log('');

// Read and display the migration SQL
const migrationPath = path.join(__dirname, 'supabase', 'migrations', '001_initial_schema.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

console.log('```sql');
console.log(migrationSQL);
console.log('```');
console.log('');
console.log('4. Click the "Run" button (or press Ctrl+Enter)');
console.log('');
console.log('5. Wait for the migration to complete');
console.log('');
console.log('6. Verify tables were created in the "Table Editor"');
console.log('');
console.log('📊 Expected tables:');
console.log('  - users');
console.log('  - user_stats');
console.log('  - games');
console.log('  - game_players');
console.log('  - game_moves');
console.log('  - friendships');
console.log('  - game_invites');
console.log('  - user_presence');
console.log('  - achievements');
console.log('  - user_achievements');
console.log('  - notifications');
console.log('');
console.log('🎉 After completing the manual setup, run:');
console.log('   npm run setup-check');
console.log('');
console.log('🚀 Then you can start development with:');
console.log('   npm run dev');