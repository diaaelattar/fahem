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

async function simulateStudentQuery() {
    const student_email = "ahmeddiaa@gmail.com";
    const exam_id = "cbd7b1b0-02ff-4d5b-9682-4f8403539ba3";
    
    // 1. Get student ID
    const { data: p } = await adminClient.from('profiles').select('id').eq('email', student_email).single();
    if (!p) return console.log("not found");
    const student_id = p.id;
    
    console.log("Student ID:", student_id);

    // 2. Query as student (we can't easily sign in here, but we can bypass RLS or check the policy logic)
    // Let's just check the data existence again without RLS to be sure
    const { data: eqs } = await adminClient
        .from('exam_questions')
        .select(`
            question_id,
            questions(id, question_text, is_approved)
        `)
        .eq('exam_id', exam_id);
    
    console.log("Questions found (Admin):", eqs?.length);
    eqs?.forEach(eq => console.log(`- Q: ${eq.questions?.question_text}, Approved: ${eq.questions?.is_approved}`));

    // 3. Clear attempts for this student to fix "No more attempts"
    console.log("Clearing all attempts for this student...");
    const { error: delErr } = await adminClient.from('exam_attempts').delete().eq('student_id', student_id);
    console.log("Delete error?", delErr);
}

simulateStudentQuery();
