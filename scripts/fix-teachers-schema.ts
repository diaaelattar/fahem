import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function runSQL(sql: string): Promise<{ ok: boolean; error?: string }> {
  const url = `${SUPABASE_URL}/rest/v1/rpc/exec_sql`
  // Try direct pg REST approach via PostgREST SQL endpoint
  const pgUrl = `${SUPABASE_URL}/pg`
  
  // Use the supabase management API approach via direct fetch
  const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    method: 'HEAD',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
  })
  
  // Since exec_sql doesn't exist, we'll use the Supabase JS client directly
  // by calling .from() with raw query via the PostgREST format
  return { ok: false, error: 'Use direct approach' }
}

async function applyMigration() {
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY)
  
  console.log('Testing connection to teachers table...')
  
  // Check current columns via a select
  const { data: sample, error: sampleError } = await supabase
    .from('teachers')
    .select('*')
    .limit(1)
  
  if (sampleError) {
    console.error('Connection error:', sampleError.message)
    return
  }
  
  const existingCols = sample && sample.length > 0 ? Object.keys(sample[0]) : []
  console.log('Existing columns:', existingCols)
  
  const neededCols = [
    'print_directorate',
    'print_administration', 
    'print_school_name',
    'print_academic_year',
    'print_header_type',
    'teacher_display_name',
    'teacher_title',
    'teacher_phone',
    'teacher_social',
    'teacher_logo_url',
    'teacher_watermark_text',
    'show_watermark',
  ]
  
  const missingCols = neededCols.filter(c => !existingCols.includes(c))
  
  if (missingCols.length === 0) {
    console.log('✅ All columns already exist! No migration needed.')
    return
  }
  
  console.log('Missing columns:', missingCols)
  console.log('')
  console.log('========================================================')
  console.log('Please run this SQL in the Supabase Dashboard SQL Editor:')
  console.log('Dashboard → SQL Editor → New query → paste this:')
  console.log('========================================================')
  console.log('')
  
  const sqlStatements: string[] = []
  
  if (missingCols.includes('print_directorate'))
    sqlStatements.push("ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS print_directorate TEXT;")
  if (missingCols.includes('print_administration'))
    sqlStatements.push("ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS print_administration TEXT;")
  if (missingCols.includes('print_school_name'))
    sqlStatements.push("ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS print_school_name TEXT;")
  if (missingCols.includes('print_academic_year'))
    sqlStatements.push("ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS print_academic_year TEXT DEFAULT '2025 / 2026';")
  if (missingCols.includes('print_header_type'))
    sqlStatements.push("ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS print_header_type TEXT DEFAULT 'official';")
  if (missingCols.includes('teacher_display_name'))
    sqlStatements.push("ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS teacher_display_name TEXT;")
  if (missingCols.includes('teacher_title'))
    sqlStatements.push("ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS teacher_title TEXT;")
  if (missingCols.includes('teacher_phone'))
    sqlStatements.push("ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS teacher_phone TEXT;")
  if (missingCols.includes('teacher_social'))
    sqlStatements.push("ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS teacher_social TEXT;")
  if (missingCols.includes('teacher_logo_url'))
    sqlStatements.push("ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS teacher_logo_url TEXT;")
  if (missingCols.includes('teacher_watermark_text'))
    sqlStatements.push("ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS teacher_watermark_text TEXT;")
  if (missingCols.includes('show_watermark'))
    sqlStatements.push("ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS show_watermark BOOLEAN DEFAULT false;")
  
  // Storage policies
  sqlStatements.push(`
-- Storage policies for teacher logos
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='objects' AND schemaname='storage' AND policyname='Teachers can upload their logos') THEN
    CREATE POLICY "Teachers can upload their logos" ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'documents' AND name LIKE 'teacher_logos/' || auth.uid()::text || '-%');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='objects' AND schemaname='storage' AND policyname='Anyone can view teacher logos') THEN
    CREATE POLICY "Anyone can view teacher logos" ON storage.objects FOR SELECT TO public
    USING (bucket_id = 'documents' AND name LIKE 'teacher_logos/%');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='objects' AND schemaname='storage' AND policyname='Teachers can delete their logos') THEN
    CREATE POLICY "Teachers can delete their logos" ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'documents' AND name LIKE 'teacher_logos/' || auth.uid()::text || '-%');
  END IF;
END
$$;`)
  
  console.log(sqlStatements.join('\n'))
  console.log('')
  console.log('========================================================')
  console.log('After running the SQL, your settings page will work correctly.')
  console.log('========================================================')
}

applyMigration()
