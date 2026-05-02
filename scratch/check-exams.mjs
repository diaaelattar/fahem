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

async function checkExamsForStudent() {
  const { data: student } = await supabase.from('students').select('*, grades(*)').eq('full_name', 'Test Student').single();
  console.log('Student Grade:', student.grades.name_ar, '(id:', student.grade_id, ')');
  
  const { data: exams } = await supabase.from('exams').select('id, title, is_published, grade_id').eq('grade_id', student.grade_id).eq('is_published', true);
  console.log('Available exams for this grade:', exams.length);
  if (exams.length === 0) {
      console.log('No exams for this grade. Updating one exam to match.');
      const { data: anyExam } = await supabase.from('exams').select('id').limit(1).single();
      if (anyExam) {
          await supabase.from('exams').update({ grade_id: student.grade_id, is_published: true }).eq('id', anyExam.id);
          console.log('Updated exam id', anyExam.id, 'to match student grade.');
      }
  }
}

checkExamsForStudent();
