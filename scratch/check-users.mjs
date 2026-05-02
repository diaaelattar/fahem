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

async function checkUsers() {
  const idToCheck = '6200bce7-bd53-41e0-8bd3-198b9c235641';
  const emailToCheck = 'diaaelattardiaa@gmail.com';
  
  console.log(`Checking user with ID: ${idToCheck}`);
  const { data: profileById, error: err1 } = await supabase.from('profiles').select('*').eq('id', idToCheck).single();
  if (err1) {
      console.log('Error or not found:', err1.message);
  } else {
      console.log('Found profile by ID:', profileById);
      // Let's reset the password for this admin to something known so the user can log in
      if (profileById.role === 'admin') {
          console.log('User is an admin. Resetting password to "12345678"');
          const { error: updateErr } = await supabase.auth.admin.updateUserById(
            idToCheck,
            { password: 'Password123#' }
          );
          if (updateErr) {
              console.log('Failed to reset password:', updateErr.message);
          } else {
              console.log('Successfully reset password to "Password123#"');
          }
      }
  }
  
  console.log(`\nChecking user with Email: ${emailToCheck}`);
  const { data: profileByEmail, error: err2 } = await supabase.from('profiles').select('*').eq('email', emailToCheck).single();
  if (err2) {
      console.log('Error or not found:', err2.message);
  } else {
      console.log('Found profile by Email:', profileByEmail);
      if (profileByEmail.role === 'admin') {
          console.log('User is an admin. Resetting password to "Password123#"');
          const { error: updateErr2 } = await supabase.auth.admin.updateUserById(
            profileByEmail.id,
            { password: 'Password123#' }
          );
          if (updateErr2) {
              console.log('Failed to reset password:', updateErr2.message);
          } else {
              console.log('Successfully reset password to "Password123#"');
          }
      } else if (profileByEmail.role === 'student') {
          console.log('User is a student. Resetting password to "123456789"');
          const { error: updateErr3 } = await supabase.auth.admin.updateUserById(
            profileByEmail.id,
            { password: 'Password123#' }
          );
          if (updateErr3) {
               console.log('Failed to reset password:', updateErr3.message);
          } else {
               console.log('Successfully reset password to "Password123#"');
          }
      }
  }
}

checkUsers();
