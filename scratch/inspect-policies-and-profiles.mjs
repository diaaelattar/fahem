import pkg from 'pg';
const { Client } = pkg;
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

console.log("Keys in process.env:");
const keys = Object.keys(process.env).filter(k => k.includes('SUPABASE') || k.includes('DATABASE') || k.includes('URL'));
console.log(keys);

const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || process.env.POSTGRES_URL;
if (!connectionString) {
  console.error("No DATABASE_URL or POSTGRES_URL found in environment");
  process.exit(1);
}

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  console.log("Connected to PostgreSQL database.");

  // 1. Inspect policies on profiles and students
  console.log("\n--- POLICIES ON public.profiles ---");
  const { rows: profilePolicies } = await client.query(`
    SELECT * FROM pg_policies WHERE tablename = 'profiles';
  `);
  console.log(profilePolicies);

  console.log("\n--- POLICIES ON public.students ---");
  const { rows: studentPolicies } = await client.query(`
    SELECT * FROM pg_policies WHERE tablename = 'students';
  `);
  console.log(studentPolicies);

  // 2. Mismatch between auth.users and public.profiles
  console.log("\n--- USER RECORDS IN auth.users vs public.profiles ---");
  const { rows: userMismatches } = await client.query(`
    SELECT 
      u.id AS auth_id, 
      u.email AS auth_email, 
      u.raw_user_meta_data AS auth_meta,
      p.id AS profile_id, 
      p.email AS profile_email, 
      p.role AS profile_role
    FROM auth.users u
    LEFT JOIN public.profiles p ON u.id = p.id;
  `);
  console.log(JSON.stringify(userMismatches, null, 2));

  // 3. Check triggers
  console.log("\n--- TRIGGERS ON auth.users OR public.profiles ---");
  const { rows: triggers } = await client.query(`
    SELECT 
      trigger_name, 
      event_manipulation, 
      event_object_table, 
      action_statement
    FROM information_schema.triggers
    WHERE event_object_table IN ('users', 'profiles', 'students');
  `);
  console.log(triggers);

  await client.end();
}

run().catch(console.error);
