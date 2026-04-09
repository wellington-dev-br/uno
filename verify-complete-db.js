const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Carregar variáveis do .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);

async function verifyAllTables() {
  console.log('=== VERIFICACAO COMPLETA DO BANCO DE DADOS UNO ===\n');

  const tables = [
    'users', 'games', 'game_players', 'game_moves',
    'achievements', 'user_achievements', 'friendships',
    'friend_requests', 'game_invitations', 'user_stats', 'rankings'
  ];

  const results = [];

  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        results.push({ table, status: 'ERROR', error: error.message });
      } else {
        results.push({ table, status: 'OK', count: data ? data.length : 0 });
      }
    } catch (err) {
      results.push({ table, status: 'ERROR', error: err.message });
    }
  }

  console.log('📊 STATUS DAS TABELAS:');
  results.forEach(r => {
    if (r.status === 'OK') {
      console.log(`✅ ${r.table}: OK (${r.count} registros)`);
    } else {
      console.log(`❌ ${r.table}: ERRO - ${r.error}`);
    }
  });

  const allOk = results.every(r => r.status === 'OK');
  const okCount = results.filter(r => r.status === 'OK').length;

  console.log(`\n🎯 RESULTADO FINAL:`);
  console.log(`${okCount}/${tables.length} tabelas funcionais`);

  if (allOk) {
    console.log('🎉 BANCO DE DADOS 100% FUNCIONAL!');
    console.log('✅ Pronto para iniciar a Fase 1: Setup & Auth');
  } else {
    console.log('⚠️ Ainda há problemas no banco de dados');
  }

  return allOk;
}

verifyAllTables().catch(console.error);