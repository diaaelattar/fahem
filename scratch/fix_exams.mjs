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

async function fixExams() {
  console.log('--- Fixing Exams and Links ---');

  // 1. Publish exams that have linked questions but are not published
  const { data: examsWithLinks } = await adminClient
    .rpc('get_exams_with_questions'); 
  
  // Wait, I don't know if get_exams_with_questions exists. 
  // Let's do it manually.
  
  const { data: exams } = await adminClient.from('exams').select('id, title, is_published');
  
  for (const exam of exams || []) {
    const { data: links } = await adminClient.from('exam_questions').select('*').eq('exam_id', exam.id);
    
    if (links && links.length > 0) {
      if (!exam.is_published) {
        console.log(`Publishing exam: ${exam.title} (${exam.id}) because it has ${links.length} questions.`);
        await adminClient.from('exams').update({ is_published: true }).eq('id', exam.id);
      }
    } else {
      if (exam.is_published) {
        console.log(`Unpublishing exam: ${exam.title} (${exam.id}) because it has 0 linked questions.`);
        await adminClient.from('exams').update({ is_published: false }).eq('id', exam.id);
      }
    }
  }

  // 2. Ensure all questions are approved
  console.log('Final approval check...');
  const { error: approveError } = await adminClient.from('questions').update({ is_approved: true }).eq('is_approved', false);
  if (approveError) console.error('Approval Error:', approveError);

  process.exit(0);
}

fixExams().catch(err => {
  console.error(err);
  process.exit(1);
});
