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

async function makeAllExamsAvailableToAhmed() {
  const ahmedGradeId = 4; // الصف الأول الإعدادي
  
  // Get all exams and update their grade to 4 and make them published
  const { data: exams, error: fetchErr } = await supabase.from('exams').select('id, title');
  if (fetchErr) {
      console.error('Error fetching exams:', fetchErr);
      return;
  }
  
  for (const exam of exams) {
      const { error: updateErr } = await supabase.from('exams').update({
          grade_id: ahmedGradeId,
          is_published: true
      }).eq('id', exam.id);
      
      if (updateErr) {
          console.error(`Error updating exam ${exam.title}:`, updateErr);
      } else {
          console.log(`Updated exam '${exam.title}' -> Grade ID: 4, Published: true`);
      }
  }
  
  console.log('All exams are now available to Ahmed!');
}

makeAllExamsAvailableToAhmed();
