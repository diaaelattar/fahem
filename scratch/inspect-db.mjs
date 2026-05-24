import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

function loadEnv() {
  const content = fs.readFileSync('.env.local', 'utf-8');
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?/);
    if (match) process.env[match[1]] = match[2]?.trim() ?? '';
  });
}
loadEnv();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspect() {
  console.log('--- Inspecting database ---');
  
  // 1. check questions columns
  try {
    const { data: questions, error: qErr } = await supabase.from('questions').select('*').limit(1);
    if (qErr) {
      console.log('Error fetching questions:', qErr.message);
    } else if (questions && questions.length > 0) {
      console.log('Columns in questions:', Object.keys(questions[0]));
    } else {
      console.log('No rows in questions, could not inspect columns directly. Trying empty select.');
      const { data: q2, error: qErr2 } = await supabase.from('questions').select('id, teacher_id').limit(1);
      if (qErr2) {
        console.log('questions has no teacher_id column:', qErr2.message);
      } else {
        console.log('questions has teacher_id column successfully!');
      }
    }
  } catch (e) {
    console.log('Exception in questions:', e.message);
  }

  // 2. check platform_announcements table
  try {
    const { data: ann, error: annErr } = await supabase.from('platform_announcements').select('*').limit(1);
    if (annErr) {
      console.log('platform_announcements table does not exist or error:', annErr.message);
    } else {
      console.log('platform_announcements table exists successfully! Columns:', ann && ann.length > 0 ? Object.keys(ann[0]) : 'exists but empty');
    }
  } catch (e) {
    console.log('Exception in platform_announcements:', e.message);
  }

  // 3. check group_students columns
  try {
    const { data: gs, error: gsErr } = await supabase.from('group_students').select('*').limit(1);
    if (gsErr) {
      console.log('Error fetching group_students:', gsErr.message);
    } else if (gs && gs.length > 0) {
      console.log('Columns in group_students:', Object.keys(gs[0]));
    } else {
      console.log('No rows in group_students. Checking if source column exists...');
      const { data: gs2, error: gsErr2 } = await supabase.from('group_students').select('id, source').limit(1);
      if (gsErr2) {
        console.log('group_students has no source column:', gsErr2.message);
      } else {
        console.log('group_students has source column successfully!');
      }
    }
  } catch (e) {
    console.log('Exception in group_students:', e.message);
  }
}

inspect();
