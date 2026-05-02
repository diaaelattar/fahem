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

async function inspectExamQuestions() {
    const exam_id = 'cbd7b1b0-02ff-4d5b-9682-4f8403539ba3';
    const { data: eqs, error } = await adminClient
        .from('exam_questions')
        .select(`
            question_id,
            questions(id, question_text, is_approved)
        `)
        .eq('exam_id', exam_id);
    
    console.log("Exam Questions linked:", eqs?.length);
    if (eqs) {
        eqs.forEach(eq => {
            console.log(`- Q ID: ${eq.question_id}, Data: ${eq.questions ? 'Found' : 'MISSING'}, Approved: ${eq.questions?.is_approved}`);
        });
    }
}

inspectExamQuestions();
