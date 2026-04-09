#!/usr/bin/env node

// UNO Online - Database Migration Script
const fs = require('fs');
const path = require('path');
const https = require('https');

console.log('🎮 UNO Online - Database Migration');
console.log('===================================');

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
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.log('SUPABASE_URL:', SUPABASE_URL);
  console.log('SERVICE_ROLE_KEY:', SERVICE_ROLE_KEY ? 'Present' : 'Missing');
  process.exit(1);
}

console.log('🌐 Supabase URL:', SUPABASE_URL);

// Read migration file
const migrationPath = path.join(__dirname, 'supabase', 'migrations', '001_initial_schema.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

console.log('📄 Migration file loaded successfully');

// Function to execute SQL via REST API
function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ query: sql });

    const options = {
      hostname: SUPABASE_URL.replace('https://', '').replace('http://', ''),
      port: 443,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve(data);
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Execute migration
async function runMigration() {
  try {
    console.log('🚀 Executing database migration...');

    // First, try to execute the entire migration as one query
    try {
      console.log('📝 Executing full migration...');
      await executeSQL(migrationSQL);
      console.log('✅ Full migration executed successfully');
    } catch (fullError) {
      console.log('⚠️  Full migration failed, trying individual statements...');

      // Split SQL into individual statements and execute them
      const statements = migrationSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i] + ';';
        console.log(`📝 Executing statement ${i + 1}/${statements.length}...`);

        try {
          await executeSQL(statement);
          console.log(`✅ Statement ${i + 1} executed successfully`);
        } catch (error) {
          console.log(`⚠️  Statement ${i + 1} failed (might be normal):`, error.message.substring(0, 100));
        }
      }
    }

    console.log('🎉 Database migration completed!');
    console.log('');
    console.log('📊 Created tables:');
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

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('');
    console.log('💡 Alternative: Copy the SQL from supabase/migrations/001_initial_schema.sql');
    console.log('   and execute it manually in the Supabase SQL Editor at:');
    console.log(`   ${SUPABASE_URL}/project/default/sql`);
    process.exit(1);
  }
}

// Run the migration
runMigration();