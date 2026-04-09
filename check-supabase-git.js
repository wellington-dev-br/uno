const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const child_process = require('child_process');

const envText = fs.readFileSync('.env.local', 'utf8');
const env = envText.split(/\r?\n/).reduce((acc, line) => {
  const [k, v] = line.split('=');
  if (k && v) acc[k.trim()] = v.trim();
  return acc;
}, {});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE;
if (!url || !key) {
  console.error('ENV INCOMPLETO: verifique NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(url, key);
const tables = ['users','games','game_players','game_moves','achievements','user_achievements','friendships','friend_requests','game_invites','game_invitations','user_presence','user_stats','rankings','notifications'];

(async () => {
  const results = [];
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from('pg_catalog.pg_tables').select('tablename').eq('tablename', table).single();
      if (error) {
        results.push({ table, error: error.message });
      } else {
        results.push({ table, exists: !!data });
      }
    } catch (err) {
      results.push({ table, error: err.message });
    }
  }
  console.log('TABLE CHECK RESULTS:');
  results.forEach(r => {
    if (r.error) {
      console.log(`${r.table}: ERROR - ${r.error}`);
    } else {
      console.log(`${r.table}: ${r.exists ? 'EXISTS' : 'MISSING'}`);
    }
  });

  let gitEmail = 'UNKNOWN';
  try {
    gitEmail = child_process.execSync('git config --get user.email', { encoding: 'utf8' }).trim();
  } catch (err) {
    gitEmail = 'ERROR: ' + err.message;
  }
  console.log('GIT EMAIL:', gitEmail);
})();
