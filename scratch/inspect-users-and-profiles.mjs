import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error("File .env.local does not exist.");
    return;
  }
  const content = fs.readFileSync(envPath, 'utf-8');
  content.split('\n').forEach(line => {
    const cleanLine = line.replace('\r', '').trim();
    if (!cleanLine || cleanLine.startsWith('#')) return;
    const parts = cleanLine.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      process.env[key] = val;
    }
  });
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env");
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

async function run() {
  console.log("Fetching profiles...");
  const { data: profiles, error: pErr } = await supabase.from('profiles').select('*');
  if (pErr) console.error("Error fetching profiles:", pErr);
  else console.log(`Total profiles found: ${profiles.length}`);

  console.log("Fetching students...");
  const { data: students, error: sErr } = await supabase.from('students').select('*');
  if (sErr) console.error("Error fetching students:", sErr);
  else console.log(`Total students found: ${students.length}`);

  console.log("Fetching auth users (admin API)...");
  const { data: { users }, error: uErr } = await supabase.auth.admin.listUsers();
  if (uErr) console.error("Error listing users:", uErr);
  else console.log(`Total auth users found: ${users.length}`);

  console.log("\n--- Comparison between auth.users and public.profiles ---");
  users.forEach(u => {
    const p = profiles?.find(prof => prof.id === u.id);
    const s = students?.find(stud => stud.id === u.id);
    console.log(`User: ${u.email} (ID: ${u.id})`);
    console.log(`  - Auth Metadata Role: ${u.raw_user_meta_data?.role}`);
    console.log(`  - Profile Role: ${p ? p.role : '❌ MISSING PROFILE'}`);
    console.log(`  - Profile Name: ${p ? p.full_name : 'N/A'}`);
    console.log(`  - Student Row: ${s ? 'Grade ID: ' + s.grade_id : '❌ MISSING STUDENT ROW'}`);
  });
}

run().catch(console.error);
