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
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

async function fixAll() {
  console.log("=== بدء إصلاح قاعدة البيانات ===\n");

  // ─── 1. إصلاح الأدمن: diaaelattardiaa@gmail.com ─────────────────────────
  console.log("1. إصلاح حساب الأدمن (diaaelattardiaa@gmail.com)...");
  const { error: adminRoleErr } = await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', '6200bce7-bd53-41e0-8bd3-198b9c235641');
  if (adminRoleErr) {
    console.error("   ❌ فشل تعديل دور الأدمن:", adminRoleErr.message);
  } else {
    console.log("   ✅ تم تعديل دور diaaelattardiaa@gmail.com إلى admin");
  }

  // ─── 2. إصلاح المعلم: bintenten15@gmail.com ─────────────────────────────
  console.log("\n2. إصلاح حساب المعلم (bintenten15@gmail.com)...");
  const { error: teacherRoleErr } = await supabase
    .from('profiles')
    .update({ role: 'teacher' })
    .eq('id', '6cbddde8-708a-422c-b6d7-f461f01e2ebf');
  if (teacherRoleErr) {
    console.error("   ❌ فشل تعديل دور المعلم:", teacherRoleErr.message);
  } else {
    console.log("   ✅ تم تعديل دور bintenten15@gmail.com إلى teacher");
  }

  // ─── 3. تأكيد أن admin@schoolsystem.com موجود في جدول teachers ───────────
  console.log("\n3. التحقق من admin@schoolsystem.com (profile role=teacher)...");
  const { data: existingTeacher } = await supabase
    .from('teachers')
    .select('id')
    .eq('id', '7244ca51-4c47-45b2-ad71-169473d8ad0c')
    .maybeSingle();
  if (existingTeacher) {
    console.log("   ✅ admin@schoolsystem.com موجود في جدول teachers");
  } else {
    const { error: teacherInsErr } = await supabase
      .from('teachers')
      .insert({ id: '7244ca51-4c47-45b2-ad71-169473d8ad0c', subscription_status: 'premium' });
    if (teacherInsErr) {
      console.error("   ❌ فشل إضافة admin@schoolsystem.com للمعلمين:", teacherInsErr.message);
    } else {
      console.log("   ✅ تم إضافة admin@schoolsystem.com لجدول teachers");
    }
  }

  // ─── 4. إضافة سجلات الطلاب المفقودة ─────────────────────────────────────
  console.log("\n4. إضافة سجلات الطلاب المفقودة...");
  const missingStudents = [
    '3bcb8cf7-5ca9-4d25-8b19-4bbfd527f71d', // teststudent1@domain.com
    '177195b6-752c-4302-9b1b-c770e23fc1b3', // tasneemelatter33@gmail.com
    '0d9d50d1-4dc9-4ec0-ba97-02147f1ec9a7', // yusefdiaa94@gmail.com
    'a4f3bf86-42e6-4424-b67e-d6356732adac', // eduomrania8@gmail.com
    '75704f7a-317e-46a6-8c74-2d6f75ae0751', // ahmeddiaa18416@gmail.com
    '23144ceb-3cbb-44f3-866f-6cb05116c163', // epthalepthal12@gmail.com
    '929d54ba-41ea-4006-bedf-ff359c15e701', // ali.zakarya13@gmail.com
  ];

  for (const studentId of missingStudents) {
    const { data: existing } = await supabase
      .from('students')
      .select('id')
      .eq('id', studentId)
      .maybeSingle();
    
    if (!existing) {
      const { error: insertErr } = await supabase
        .from('students')
        .insert({ id: studentId, xp_points: 0, level: 1, streak_days: 0 });
      if (insertErr) {
        console.error(`   ❌ فشل إضافة طالب ${studentId}: ${insertErr.message}`);
      } else {
        console.log(`   ✅ تم إضافة سجل للطالب ${studentId}`);
      }
    } else {
      console.log(`   ⏭️  الطالب ${studentId} موجود مسبقاً`);
    }
  }

  // ─── 5. التحقق النهائي ────────────────────────────────────────────────────
  console.log("\n=== التحقق النهائي ===");
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('email, role, full_name')
    .eq('id', '6200bce7-bd53-41e0-8bd3-198b9c235641')
    .single();
  console.log("الأدمن:", adminProfile);

  const { data: teacherProfile } = await supabase
    .from('profiles')
    .select('email, role, full_name')
    .eq('id', '6cbddde8-708a-422c-b6d7-f461f01e2ebf')
    .single();
  console.log("المعلم:", teacherProfile);

  const { data: teacherProfile2 } = await supabase
    .from('profiles')
    .select('email, role, full_name')
    .eq('id', '7244ca51-4c47-45b2-ad71-169473d8ad0c')
    .single();
  console.log("المعلم 2:", teacherProfile2);

  const { data: studentCount } = await supabase
    .from('students')
    .select('id', { count: 'exact', head: true });
  console.log("عدد الطلاب في جدول students:", studentCount);

  console.log("\n✅ انتهى الإصلاح!");
}

fixAll().catch(console.error);
