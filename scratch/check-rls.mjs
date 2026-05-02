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

async function checkRLS() {
    // Check policies on students table
    const { data, error } = await supabase.rpc('run_sql', { sql_query: "SELECT * FROM pg_policies WHERE tablename = 'students';" });
    if (error) {
        console.log("Could not run rpc run_sql, maybe it doesn't exist. Let's just create the policy directly.");
        
        // We can just execute the SQL using the postgres meta if we had a direct connection, 
        // but with supabase client we can't easily run arbitrary SQL without RPC.
        // Let's create an RPC or just try to insert the policy if we can.
        
        console.log(error);
    } else {
        console.log("Policies:", data);
    }
}

checkRLS();
