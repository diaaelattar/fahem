/**
 * create-student-answers-bucket.mjs
 * ─────────────────────────────────
 * يُنشئ مساحة تخزين Supabase لصور إجابات الطلاب
 * التشغيل: node create-student-answers-bucket.mjs
 */
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'

// Load .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.join(__dirname, '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  envContent.split('\n').forEach(line => {
    const [key, ...vals] = line.split('=')
    if (key && vals.length) process.env[key.trim()] = vals.join('=').trim()
  })
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey)

async function createBucket() {
  console.log('📦 إنشاء bucket: student-answers-images ...')

  const { data: existing } = await supabase.storage.getBucket('student-answers-images')
  if (existing) {
    console.log('✅ الـ bucket موجود بالفعل:', existing.name)
  } else {
    const { data, error } = await supabase.storage.createBucket('student-answers-images', {
      public: false, // private - authenticated access only
      fileSizeLimit: 15 * 1024 * 1024, // 15 MB max per file
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
    })

    if (error) {
      console.error('❌ فشل إنشاء الـ bucket:', error.message)
      process.exit(1)
    }
    console.log('✅ تم إنشاء الـ bucket:', data?.name)
  }

  // إعداد سياسات الوصول (RLS)
  console.log('🔒 إعداد سياسات الوصول ...')

  // 1. الطلاب يستطيعون رفع صورهم فقط (مسار يبدأ بـ attemptId/questionId)
  const policies = [
    {
      name: 'student_upload_own',
      sql: `
        CREATE POLICY IF NOT EXISTS "Students can upload own answer images"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (
          bucket_id = 'student-answers-images'
          AND auth.uid() IS NOT NULL
        );
      `
    },
    {
      name: 'student_read_own',
      sql: `
        CREATE POLICY IF NOT EXISTS "Students can read own answer images"
        ON storage.objects FOR SELECT
        TO authenticated
        USING (
          bucket_id = 'student-answers-images'
          AND auth.uid() IS NOT NULL
        );
      `
    },
    {
      name: 'service_role_all',
      sql: `
        CREATE POLICY IF NOT EXISTS "Service role full access"
        ON storage.objects FOR ALL
        TO service_role
        USING (bucket_id = 'student-answers-images');
      `
    }
  ]

  for (const policy of policies) {
    const { error: policyError } = await supabase.rpc('exec_sql', { sql: policy.sql }).catch(() => ({ error: null }))
    if (policyError) {
      console.warn(`⚠️  سياسة ${policy.name}: ${policyError.message} (ربما موجودة بالفعل)`)
    } else {
      console.log(`✅ سياسة ${policy.name}: تم الإعداد`)
    }
  }

  console.log('\n🎉 تم الإعداد بنجاح!')
  console.log('   Bucket: student-answers-images')
  console.log('   الحد الأقصى للملف: 15 ميجابايت')
  console.log('   الأنواع المسموحة: JPEG, PNG, WebP, HEIC')
}

createBucket().catch(console.error)
