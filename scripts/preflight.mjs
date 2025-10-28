import fs from 'node:fs';
import path from 'node:path';

function parseEnv(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const lines = raw.split(/\r?\n/);
    const env = {};
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith('\'') && val.endsWith('\'')) || (val.startsWith('`') && val.endsWith('`'))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
    return env;
  } catch (e) {
    return {};
  }
}

function logTitle() {
  console.log('\n=== Preflight de conexión ===');
}

function logStatus(name, ok, details) {
  const icon = ok === true ? '✅' : (ok === false ? '❌' : '⚠️');
  console.log(`${icon} ${name}: ${details}`);
}

async function checkBackend(origin) {
  const url = `${origin.replace(/\/$/, '')}/api/trucks`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1500);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { accept: 'application/json' } });
    clearTimeout(timeout);
    if (res.ok) {
      logStatus('Backend local', true, `OK (${url})`);
    } else {
      logStatus('Backend local', false, `HTTP ${res.status} (${url})`);
    }
  } catch (e) {
    logStatus('Backend local', false, `Sin respuesta (${url})`);
  }
}

async function checkSupabase(url, key) {
  let createClient;
  try {
    ({ createClient } = await import('@supabase/supabase-js'));
  } catch (e) {
    logStatus('Supabase', false, 'Dependencia @supabase/supabase-js no encontrada');
    return;
  }
  try {
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const { data, error } = await supabase.from('trucks').select('id').limit(1);
    if (error) {
      if ((error.message && /relation .* does not exist/i.test(error.message)) || error.code === '42P01') {
        logStatus('Supabase', true, 'Conectado, pero falta aplicar schema (tabla trucks)');
      } else {
        logStatus('Supabase', false, `Error: ${error.message}`);
      }
    } else {
      logStatus('Supabase', true, 'Conectado');
    }
  } catch (e) {
    logStatus('Supabase', false, `Error de conexión: ${e.message}`);
  }
}

(async () => {
  logTitle();
  const env = parseEnv(path.resolve(process.cwd(), '.env.development'));
  const supabaseUrl = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anonKey = env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const backendOrigin = env.VITE_BACKEND_ORIGIN || process.env.VITE_BACKEND_ORIGIN || 'http://localhost:3000';

  if (supabaseUrl && anonKey) {
    await checkSupabase(supabaseUrl, anonKey);
  } else {
    logStatus('Supabase', false, 'No configurado (VITE_SUPABASE_URL/ANON_KEY)');
  }
  await checkBackend(backendOrigin);
  console.log('==============================\n');
})();