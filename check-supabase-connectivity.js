const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envText = fs.readFileSync('.env.local', 'utf8');
const env = envText.split(/\r?\n/).reduce((acc, line) => {
  const [key, value] = line.split('=');
  if (key && value) acc[key.trim()] = value.trim();
  return acc;
}, {});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE;

if (!url || !key) {
  console.error('ENV INCOMPLETO: verifique NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(url, key);

(async () => {
  const { data, error } = await supabase.from('users').select('id').limit(1);
  if (error) {
    console.error('Conexao falhou:', error.message);
    process.exit(1);
  }
  console.log('Conexao estabelecida com Supabase. Url:', url);
  console.log('Resposta de teste (users):', data);
})();