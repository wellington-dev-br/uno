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

async function testTables() {
  console.log('Verificando acesso as tabelas...\n');

  const tables = ['games', 'game_players', 'game_moves'];
  const results = [];

  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        results.push({ table, status: 'ERROR', error: error.message });
      } else {
        results.push({ table, status: 'OK', count: data.length });
      }
    } catch (err) {
      results.push({ table, status: 'ERROR', error: err.message });
    }
  }

  console.log('Resultados:');
  results.forEach(r => {
    if (r.status === 'OK') {
      console.log(`OK ${r.table}: ${r.count} registros encontrados`);
    } else {
      console.log(`ERROR ${r.table}: ${r.error}`);
    }
  });

  const allOk = results.every(r => r.status === 'OK');
  console.log(`\n${allOk ? 'SUCESSO' : 'PROBLEMA'} - Todas as tabelas ${allOk ? 'funcionam' : 'ainda tem problemas'}!`);
}

testTables().catch(console.error);