import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf-8');
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      process.env[match[1]] = match[2] ? match[2].trim() : '';
    }
  });
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, adminKey);

async function checkRpc() {
  // Let's try to query the list of routines from public schema using standard postgres tables
  // but wait, supabase JS client allows querying public tables or pg_catalog if exposed, but pg_catalog is usually not exposed.
  // Let's see if we can call a common custom function if it exists, or check the database.
  // Wait, let's check if there is an RPC function named "exec_sql" or "run_sql" or "execute_sql" by calling it.
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: 'SELECT 1' });
    console.log('rpc(exec_sql):', { data, error });
  } catch (e) {
    console.log('rpc(exec_sql) failed with exception:', e.message);
  }

  try {
    const { data, error } = await supabase.rpc('run_sql', { sql: 'SELECT 1' });
    console.log('rpc(run_sql):', { data, error });
  } catch (e) {
    console.log('rpc(run_sql) failed with exception:', e.message);
  }
}

checkRpc();
