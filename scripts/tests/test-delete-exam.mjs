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

const supabaseAdmin = createClient(url, adminKey);

async function testDeleteExam() {
   // Fetch first exam to delete
   const { data: exam } = await supabaseAdmin.from('exams').select('id, title').limit(1).single();
   if (!exam) return console.log("No exams to delete");
   
   console.log("Found exam to delete:", exam.title, exam.id);
   
   const { error } = await supabaseAdmin.from('exams').delete().eq('id', exam.id);
   
   if (error) {
       console.error("Delete failed:", error);
   } else {
       console.log("Delete succeeded!");
   }
}

testDeleteExam();
