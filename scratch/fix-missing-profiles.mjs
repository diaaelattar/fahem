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
  console.log("Fetching profiles, students, and auth users...");
  const { data: profiles } = await supabase.from('profiles').select('*');
  const { data: students } = await supabase.from('students').select('*');
  const { data: { users } } = await supabase.auth.admin.listUsers();

  console.log(`Checking ${users.length} users for missing profiles...`);
  
  for (const u of users) {
    const p = profiles?.find(prof => prof.id === u.id);
    if (!p) {
      console.log(`User ${u.email} (ID: ${u.id}) is missing a profile. Creating one...`);
      
      const fullName = u.user_metadata?.full_name || u.email?.split('@')[0] || 'مستخدم جديد';
      const role = u.user_metadata?.role || 'student'; // Default to student if not specified
      
      const { error: pErr } = await supabase.from('profiles').insert({
        id: u.id,
        email: u.email,
        full_name: fullName,
        role: role,
        is_active: true
      });
      
      if (pErr) {
        console.error(`  Error creating profile for ${u.email}:`, pErr);
        continue;
      }
      console.log(`  Profile created successfully as '${role}'.`);

      if (role === 'student') {
        const s = students?.find(stud => stud.id === u.id);
        if (!s) {
          console.log(`  Creating student row for ${u.email}...`);
          const { error: sErr } = await supabase.from('students').insert({
            id: u.id,
            xp_points: 0,
            level: 1,
            streak_days: 0
          });
          if (sErr) console.error(`    Error creating student row:`, sErr);
          else console.log(`    Student row created successfully.`);
        }
      } else if (role === 'teacher') {
        console.log(`  Creating teacher row for ${u.email}...`);
        const { error: tErr } = await supabase.from('teachers').insert({
          id: u.id,
          subscription_status: 'premium'
        });
        if (tErr) console.error(`    Error creating teacher row:`, tErr);
        else console.log(`    Teacher row created successfully.`);
      }
    } else {
      // Profile exists, check if student row is missing for student role
      if (p.role === 'student') {
        const s = students?.find(stud => stud.id === u.id);
        if (!s) {
          console.log(`User ${u.email} has student role but is missing student row. Creating one...`);
          const { error: sErr } = await supabase.from('students').insert({
            id: u.id,
            xp_points: 0,
            level: 1,
            streak_days: 0
          });
          if (sErr) console.error(`  Error creating student row:`, sErr);
          else console.log(`  Student row created successfully.`);
        }
      }
    }
  }

  console.log("Fix completed.");
}

run().catch(console.error);
