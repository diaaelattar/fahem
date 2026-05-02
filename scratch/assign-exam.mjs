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

async function assignExamToAhmed() {
  const email = "ahmeddiaa@gmail.com";
  
  // Get student grade
  const { data: profile } = await supabase.from('profiles').select('id').eq('email', email).single();
  if (!profile) {
      console.log("Ahmed not found!");
      return;
  }
  
  const { data: student } = await supabase.from('students').select('*, grades(*)').eq('id', profile.id).single();
  if (!student) {
      console.log("Student record not found!");
      return;
  }
  
  console.log(`Ahmed's Grade: ${student.grades?.name_ar} (ID: ${student.grade_id})`);
  
  // Find any exam and update its grade to match Ahmed's
  const { data: exams } = await supabase.from('exams').select('id, title, is_published, grade_id').limit(1);
  if (exams && exams.length > 0) {
      const exam = exams[0];
      console.log(`Updating exam '${exam.title}' (ID: ${exam.id}) to match Ahmed's grade`);
      
      const { error } = await supabase.from('exams').update({ 
          grade_id: student.grade_id, 
          is_published: true 
      }).eq('id', exam.id);
      
      if (error) {
          console.error("Error updating exam:", error);
      } else {
          console.log("Successfully assigned exam to Ahmed's grade!");
      }
  } else {
      console.log("No exams found in database to update!");
  }
}

assignExamToAhmed();
