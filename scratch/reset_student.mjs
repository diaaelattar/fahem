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

async function resetAndVerify() {
  const email = "ahmeddiaa@gmail.com";
  const newPassword = "ExamTest123!";

  console.log('--- Checking Questions ---');
  const { count: totalQuestions } = await adminClient.from('questions').select('*', { count: 'exact', head: true });
  const { count: unapprovedQuestions } = await adminClient.from('questions').select('*', { count: 'exact', head: true }).eq('is_approved', false);
  console.log(`Total questions: ${totalQuestions}, Unapproved: ${unapprovedQuestions}`);

  if (unapprovedQuestions && unapprovedQuestions > 0) {
    console.log('Approving questions...');
    await adminClient.from('questions').update({ is_approved: true }).eq('is_approved', false);
  }

  console.log('--- Resetting Student Password ---');
  const { data: profile } = await adminClient.from('profiles').select('id').eq('email', email).single();
  
  if (profile) {
    const { error: resetError } = await adminClient.auth.admin.updateUserById(
      profile.id,
      { password: newPassword }
    );
    if (resetError) {
      console.error('Error resetting password:', resetError);
    } else {
      console.log(`Password for ${email} reset to: ${newPassword}`);
    }
  } else {
    console.log(`Student ${email} not found.`);
  }

  process.exit(0);
}

resetAndVerify().catch(err => {
  console.error(err);
  process.exit(1);
});
