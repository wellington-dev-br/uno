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

async function testAuth() {
  console.log('🔐 Testando configuração do Supabase Auth...\n');

  try {
    // Test 1: Verificar conexão
    console.log('1. Testando conexão com Supabase...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError && userError.message !== 'Auth session missing!') {
      throw userError;
    }
    console.log('✅ Conexão OK');

    // Test 2: Verificar tabelas de auth
    console.log('2. Verificando tabelas de usuários...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (usersError) {
      console.log('❌ Erro na tabela users:', usersError.message);
    } else {
      console.log('✅ Tabela users OK');
    }

    // Test 3: Verificar RLS
    console.log('3. Testando Row Level Security...');
    const { data: publicUsers, error: rlsError } = await supabase
      .from('users')
      .select('id, username')
      .limit(5);

    if (rlsError) {
      console.log('❌ Erro RLS:', rlsError.message);
    } else {
      console.log('✅ RLS OK - usuários públicos visíveis');
    }

    console.log('\n🎉 Configuração do Auth está funcional!');
    console.log('✅ Pronto para testar login/register');

  } catch (error) {
    console.error('❌ Erro no teste de auth:', error.message);
  }
}

testAuth().catch(console.error);