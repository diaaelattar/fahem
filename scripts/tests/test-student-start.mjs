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

async function signInAndTest() {
    const email = "ahmeddiaa@gmail.com";
    const { data: profile } = await adminClient.from('profiles').select('*').eq('email', email).single();
    if (!profile) return console.log('profile not found');
    
    // Simulate nextjs client action doing an insert
    // actually, let's just see if there's any JS error in `app/student/exams/[id]/start/page.tsx`
    // What if the form action redirects incorrectly?
    // <form action={`/student/exams/${exam.id}/take`} method="GET">
    // Wait, GET form submission with `name="attemptId"` appends `?attemptId=XXX` to the URL.
}
signInAndTest();
