import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  const conten = fs.readFileSync(envPath, 'utf-8');
  conten.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      process.env[match[1]] = match[2] ? match[2].trim() : '';
    }
  });
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, serviceKey);

async function inspectTeachers() {
  console.log("Inspecting teachers and groups...");
  
  const { data: teachers, error: tErr } = await supabase
    .from('teachers')
    .select('id, profiles(full_name, email)');

  if (tErr) {
    console.error("Error fetching teachers:", tErr);
    return;
  }

  console.log(`Found ${teachers.length} teachers:`);
  for (const t of teachers) {
    console.log(`- Teacher ID: ${t.id}, Name: ${t.profiles?.full_name}, Email: ${t.profiles?.email}`);
    
    // Fetch their groups
    const { data: groups, error: gErr } = await supabase
      .from('student_groups')
      .select('*, group_students(count), grades(name_ar)')
      .eq('teacher_id', t.id);

    if (gErr) {
      console.error(`  Error fetching groups for teacher ${t.id}:`, gErr);
    } else {
      console.log(`  Groups count: ${groups.length}`);
      for (const g of groups) {
        console.log(`    * Group: ${g.name_ar} (Code: ${g.invite_code}, Students: ${g.group_students[0]?.count || 0})`);
      }
    }
  }
}

inspectTeachers();
