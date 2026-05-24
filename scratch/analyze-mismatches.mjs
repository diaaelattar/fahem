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
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

async function analyze() {
  console.log("=== DB Role Alignment Analysis ===");
  
  const { data: profiles, error: pErr } = await supabase.from('profiles').select('*');
  const { data: admins, error: aErr } = await supabase.from('admins').select('*');
  const { data: teachers, error: tErr } = await supabase.from('teachers').select('*');
  const { data: students, error: sErr } = await supabase.from('students').select('*');
  
  if (pErr || aErr || tErr || sErr) {
    console.error("Fetch error:", { pErr, aErr, tErr, sErr });
    return;
  }

  const profileMap = new Map(profiles.map(p => [p.id, p]));
  const adminIds = new Set(admins.map(a => a.id));
  const teacherIds = new Set(teachers.map(t => t.id));
  const studentIds = new Set(students.map(s => s.id));

  console.log(`Profiles: ${profiles.length}`);
  console.log(`Admins: ${admins.length}`);
  console.log(`Teachers: ${teachers.length}`);
  console.log(`Students: ${students.length}`);

  console.log("\n--- Checking for Inconsistencies where User is in Role table but Profile has wrong Role ---");
  for (const adminId of adminIds) {
    const profile = profileMap.get(adminId);
    if (profile && profile.role !== 'admin') {
      console.log(`Mismatch (Admin): User ${profile.email} (${profile.full_name}) has ID ${adminId}. In profiles, role is "${profile.role}", but exists in admins table!`);
    }
  }

  for (const teacherId of teacherIds) {
    const profile = profileMap.get(teacherId);
    if (profile && profile.role !== 'teacher') {
      console.log(`Mismatch (Teacher): User ${profile.email} (${profile.full_name}) has ID ${teacherId}. In profiles, role is "${profile.role}", but exists in teachers table!`);
    }
  }

  for (const studentId of studentIds) {
    const profile = profileMap.get(studentId);
    if (profile && profile.role !== 'student') {
      console.log(`Mismatch (Student): User ${profile.email} (${profile.full_name}) has ID ${studentId}. In profiles, role is "${profile.role}", but exists in students table!`);
    }
  }

  console.log("\n--- Checking for Inconsistencies where Profile has Role but is missing from corresponding table ---");
  for (const profile of profiles) {
    if (profile.role === 'admin' && !adminIds.has(profile.id)) {
      console.log(`Missing Admin Record: User ${profile.email} has role "admin" but is missing from admins table.`);
    }
    if (profile.role === 'teacher' && !teacherIds.has(profile.id)) {
      console.log(`Missing Teacher Record: User ${profile.email} has role "teacher" but is missing from teachers table.`);
    }
    if (profile.role === 'student' && !studentIds.has(profile.id)) {
      console.log(`Missing Student Record: User ${profile.email} has role "student" but is missing from students table.`);
    }
  }
}

analyze();
