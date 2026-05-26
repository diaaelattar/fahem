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

async function testProcedure() {
    const exam_id = 'cbd7b1b0-02ff-4d5b-9682-4f8403539ba3';
    
    console.log("Calling rpc on exam:", exam_id);
    const { data: canAttempt, error } = await adminClient.rpc('can_attempt_exam', { p_exam_id: exam_id });
    
    console.log("Response:", canAttempt);
    console.log("Error:", error);
}

testProcedure();
