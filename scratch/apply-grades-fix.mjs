import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

function loadEnv() {
  const content = fs.readFileSync('.env.local', 'utf-8');
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?/);
    if (match) process.env[match[1]] = match[2]?.trim() ?? '';
  });
}
loadEnv();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  console.log('--- Applying Grades Fix ---');

  // 1. Update Grade 3
  console.log('Updating Grade 3 Primary to stage_id: 1...');
  const { error: e3 } = await supabase
    .from('grades')
    .update({ stage_id: 1, sort_order: 3, grade_number: 3 })
    .or('id.eq.16,name_ar.eq.الصف الثالث الابتدائي');
  if (e3) {
    console.error('Error updating Grade 3:', e3);
  } else {
    console.log('Grade 3 updated successfully.');
  }

  // 2. Check and Insert Grade 1
  console.log('Checking/Inserting Grade 1 Primary...');
  const { data: g1Exist } = await supabase
    .from('grades')
    .select('id')
    .eq('name_ar', 'الصف الأول الابتدائي')
    .maybeSingle();

  if (g1Exist) {
    console.log('Grade 1 already exists with ID:', g1Exist.id);
  } else {
    const { data: insertedG1, error: e1 } = await supabase
      .from('grades')
      .insert({
        stage_id: 1,
        name_ar: 'الصف الأول الابتدائي',
        name_en: 'Grade 1',
        grade_number: 1,
        sort_order: 1
      })
      .select();
    if (e1) {
      console.error('Error inserting Grade 1:', e1);
    } else {
      console.log('Grade 1 inserted successfully:', insertedG1);
    }
  }

  // 3. Check and Insert Grade 2
  console.log('Checking/Inserting Grade 2 Primary...');
  const { data: g2Exist } = await supabase
    .from('grades')
    .select('id')
    .eq('name_ar', 'الصف الثاني الابتدائي')
    .maybeSingle();

  if (g2Exist) {
    console.log('Grade 2 already exists with ID:', g2Exist.id);
  } else {
    const { data: insertedG2, error: e2 } = await supabase
      .from('grades')
      .insert({
        stage_id: 1,
        name_ar: 'الصف الثاني الابتدائي',
        name_en: 'Grade 2',
        grade_number: 2,
        sort_order: 2
      })
      .select();
    if (e2) {
      console.error('Error inserting Grade 2:', e2);
    } else {
      console.log('Grade 2 inserted successfully:', insertedG2);
    }
  }
  
  console.log('--- Done ---');
}

run();
