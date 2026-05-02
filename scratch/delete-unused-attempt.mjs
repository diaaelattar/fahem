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

async function deleteUnusedAttempt() {
  const email = 'ahmeddiaa@gmail.com';
  // Get student id
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();
  const user = users?.users.find(u => u.email === email);
  
  if (!user) {
    console.log('User not found');
    return;
  }
  
  // Delete the attempt that was accidentally created
  const { data, error } = await supabase
    .from('exam_attempts')
    .delete()
    .eq('student_id', user.id)
    .eq('exam_id', '7b75f402-5835-48c9-a3da-49bc1a6093d5')
    .is('completed_at', null);
    
  console.log('Deleted attempt:', data, error);
}

deleteUnusedAttempt();
