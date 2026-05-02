import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf-8');
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) process.env[match[1]] = match[2]?.trim() || '';
  });
}
loadEnv();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function diagnose() {
  // 1. Check subjects
  const { data: subjects } = await supabase.from('subjects').select('id, name_ar').limit(5);
  console.log('Subjects:', subjects);

  // 2. Check questions columns
  const { data: questions } = await supabase.from('questions').select('id, subject_id, grade_id, question_type').limit(3);
  console.log('Questions sample:', questions);

  // 3. Check grades
  const { data: grades } = await supabase.from('grades').select('id, name_ar').limit(5);
  console.log('Grades:', grades);

  // 4. Check student record
  const { data: students } = await supabase.from('students').select('id, grade_id').limit(3);
  console.log('Students:', students);

  // 5. Check exams with questions
  const { data: exams } = await supabase.from('exams').select('id, title, is_published, grade_id').limit(5);
  console.log('Exams:', exams);

  // 6. Check exam_questions
  const { data: eqs } = await supabase.from('exam_questions').select('exam_id, question_id').limit(3);
  console.log('Exam Questions:', eqs);

  // 7. Count questions per subject
  const { data: qPerSubject } = await supabase
    .from('questions')
    .select('subject_id')
    .limit(100);
  const counts = {};
  qPerSubject?.forEach(q => { counts[q.subject_id] = (counts[q.subject_id] || 0) + 1; });
  console.log('Questions per subject_id:', counts);
}

diagnose();
