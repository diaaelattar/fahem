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
const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminClient = createClient(url, adminKey);

async function inspectExams() {
  console.log('--- Inspecting Exams and Questions ---');
  
  const { data: exams } = await adminClient
    .from('exams')
    .select('id, title, questions_count, is_published');
  
  console.log('Exams found:', exams?.length);
  for (const exam of exams || []) {
    const { data: qLinks } = await adminClient
      .from('exam_questions')
      .select('question_id')
      .eq('exam_id', exam.id);
    
    console.log(`Exam: ${exam.title} (${exam.id})`);
    console.log(` - Metadata questions_count: ${exam.questions_count}`);
    console.log(` - Linked questions in exam_questions: ${qLinks?.length || 0}`);
    console.log(` - Published: ${exam.is_published}`);
  }

  const { data: allApprovedQ } = await adminClient
    .from('questions')
    .select('id, question_text')
    .eq('is_approved', true);
  
  console.log(`Total Approved Questions in DB: ${allApprovedQ?.length || 0}`);
  
  process.exit(0);
}

inspectExams();
