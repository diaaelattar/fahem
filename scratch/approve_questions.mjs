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

async function approveAndPublish() {
  console.log('--- Approving Questions ---');
  const { data: questions, error: qError } = await adminClient
    .from('questions')
    .update({ is_approved: true })
    .eq('is_approved', false)
    .select();
  
  if (qError) {
    console.error('Error approving questions:', qError);
  } else {
    console.log(`Approved ${questions?.length || 0} questions.`);
  }

  console.log('--- Publishing Exams ---');
  // Only publish exams that have questions
  const { data: examsToPublish, error: eFetchError } = await adminClient
    .from('exams')
    .select('id, title, questions_count')
    .eq('is_published', false);

  if (eFetchError) {
    console.error('Error fetching exams:', eFetchError);
  } else {
    for (const exam of examsToPublish || []) {
      if (exam.questions_count > 0) {
        const { error: pError } = await adminClient
          .from('exams')
          .update({ is_published: true })
          .eq('id', exam.id);
        
        if (pError) {
          console.error(`Error publishing exam ${exam.title}:`, pError);
        } else {
          console.log(`Published exam: ${exam.title}`);
        }
      } else {
        console.log(`Skipped exam ${exam.title} because it has no questions.`);
      }
    }
  }

  console.log('--- Checking Student Access ---');
  const email = "ahmeddiaa@gmail.com";
  const { data: profile } = await adminClient.from('profiles').select('*').eq('email', email).single();
  
  if (profile) {
    const { data: availableExams } = await adminClient
      .from('exams')
      .select('id, title')
      .eq('is_published', true);
    
    console.log(`Student ${email} can now see ${availableExams?.length || 0} exams.`);
    availableExams?.forEach(ex => console.log(` - ${ex.title}`));
  } else {
    console.log(`Student ${email} not found.`);
  }
  
  console.log('--- Done ---');
  process.exit(0);
}

approveAndPublish().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
