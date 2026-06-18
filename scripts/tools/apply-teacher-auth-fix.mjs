import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

const { Client } = pg;

// نبني connection string من URL الـ Supabase
// الصيغة: postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-eu-central-1.pooler.supabase.com:5432/postgres
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

// استخراج project ref من الـ URL
const projectRef = SUPABASE_URL.replace('https://', '').split('.')[0];
// نفس الـ connection string المستخدم في scripts أخرى في المشروع
const connectionString = `postgresql://postgres.${projectRef}:D%238291947dhs@aws-1-eu-central-1.pooler.supabase.com:5432/postgres`;

const sqlPath = path.join(__dirname, '../../supabase/migrations/20260615000001_fix_teacher_registration.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

async function run() {
  console.log('🔧 جاري الاتصال بقاعدة البيانات...');
  console.log(`   Project: ${projectRef}`);
  
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('✅ تم الاتصال بنجاح!');
    
    console.log('\n🔄 تطبيق migration إصلاح تسجيل المعلمين...');
    await client.query(sql);
    
    console.log('\n✅ نجح تطبيق الـ migration!');
    console.log('\nالتغييرات المطبقة:');
    console.log('  ✔ تم تحديث trigger handle_new_user للسماح بدور teacher');
    console.log('  ✔ تم تحديث trigger prevent_profile_role_update للسماح لـ service_role بتعديل الأدوار');
    console.log('  ✔ تم إضافة سياسات INSERT المطلوبة على profiles و teachers');
    console.log('\n🎉 يمكنك الآن تسجيل حسابات المعلمين بشكل صحيح!');
    
  } catch (e) {
    console.error('\n❌ خطأ في تطبيق الـ migration:', e.message);
    console.error('\nحاول تطبيق الـ SQL يدوياً من لوحة تحكم Supabase:');
    console.error('https://supabase.com/dashboard → SQL Editor → New Query');
    console.error('\nمسار ملف الـ SQL:');
    console.error(sqlPath);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
