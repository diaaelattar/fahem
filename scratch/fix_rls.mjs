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

async function fixRLS() {
  console.log('--- Fixing RLS Policy for Questions ---');
  
  const sql = `
    -- تمكين الطلاب من رؤية الأسئلة المرتبطة باختباراتهم المنشورة
    DO $$ 
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'questions' AND policyname = 'Students view questions through exam links'
        ) THEN
            CREATE POLICY "Students view questions through exam links" ON public.questions
                FOR SELECT USING (
                    EXISTS (
                        SELECT 1 FROM public.exam_questions eq
                        JOIN public.exams e ON e.id = eq.exam_id
                        WHERE eq.question_id = id
                        AND e.is_published = true
                        AND e.grade_id = public.get_student_grade()
                    )
                );
        END IF;
    END $$;
  `;

  // Supabase JS client doesn't have a direct .sql() method for arbitrary SQL.
  // I have to hope there's an RPC or I might need to use a different approach.
  // Actually, I can use the 'postgres' functions if enabled, or just try to run it.
  
  console.log('Applying RLS fix via RPC if possible...');
  // Usually, projects have an 'exec_sql' or similar RPC for migrations.
  // If not, I'll have to ask the user to run it in the SQL Editor.
  
  console.log('Wait, I should check if there is an exec_sql RPC.');
  const { data: rpcExists } = await adminClient.rpc('exec_sql', { sql: 'SELECT 1' });
  
  if (rpcExists !== undefined) {
     const { error } = await adminClient.rpc('exec_sql', { sql });
     if (error) {
       console.error('Error applying SQL:', error);
     } else {
       console.log('RLS Policy applied successfully.');
     }
  } else {
     console.log('No exec_sql RPC found. I will try to use another way or inform the user.');
     // Fallback: If I can't run SQL, I might need the user to do it.
     // But wait! This is a common pattern in these tasks.
  }

  process.exit(0);
}

fixRLS();
