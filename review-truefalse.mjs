import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load .env.local
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf-8');
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

// ===================================================
// قواعد التوحيد
// ===================================================
// القيم التي تعني "صحيح":  صح | صحيح | true | True | TRUE | نعم | ص
// القيم التي تعني "خطأ":   خطأ | خاطئة | خاطئ | false | False | FALSE | لا | خ | ب

const TRUE_VARIANTS  = ['صح', 'صحيح', 'true', 'True', 'TRUE', 'نعم', 'ص'];
const FALSE_VARIANTS = ['خطأ', 'خاطئة', 'خاطئ', 'false', 'False', 'FALSE', 'لا', 'خ', 'ب'];

// القيمة الموحّدة الصحيحة
const CANONICAL_TRUE  = 'صح';
const CANONICAL_FALSE = 'خطأ';

function canonicalize(val) {
  if (!val) return null;
  const v = val.trim();
  if (TRUE_VARIANTS.includes(v))  return CANONICAL_TRUE;
  if (FALSE_VARIANTS.includes(v)) return CANONICAL_FALSE;
  return null; // غير معروف
}

async function main() {
  console.log('🔍 جارٍ جلب جميع أسئلة الصح والخطأ من قاعدة البيانات...\n');

  // جلب جميع أسئلة true_false
  let allQuestions = [];
  let from = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('questions')
      .select('id, question_text, question_type, correct_answer, options')
      .eq('question_type', 'true_false')
      .range(from, from + pageSize - 1);
    if (error) { console.error('❌ خطأ في الجلب:', error.message); process.exit(1); }
    allQuestions = allQuestions.concat(data);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  console.log(`📊 إجمالي أسئلة الصح/الخطأ: ${allQuestions.length}\n`);
  console.log('=' .repeat(80));

  const issues   = [];   // أسئلة تحتاج إصلاح
  const unknown  = [];   // أسئلة بقيمة غير معروفة

  for (const q of allQuestions) {
    const current  = (q.correct_answer || '').trim();
    const fixed    = canonicalize(current);
    const opts     = Array.isArray(q.options) ? q.options : [];

    // فحص الخيارات أيضاً
    const fixedOpts = opts.map(o => canonicalize((o||'').trim()) ?? o);
    const optsNeedFix = JSON.stringify(opts) !== JSON.stringify(fixedOpts);

    if (fixed === null) {
      unknown.push({ id: q.id, question_text: q.question_text?.slice(0,80), current });
      continue;
    }

    const answerNeedsFix = fixed !== current;

    if (answerNeedsFix || optsNeedFix) {
      issues.push({
        id: q.id,
        question_text: q.question_text?.slice(0, 80),
        old_answer: current,
        new_answer: fixed,
        old_opts: opts,
        new_opts: fixedOpts,
        answerNeedsFix,
        optsNeedFix,
      });
    }
  }

  // ===================================================
  // طباعة التقرير
  // ===================================================
  if (issues.length === 0 && unknown.length === 0) {
    console.log('✅ جميع الأسئلة موحّدة ولا تحتاج إلى تعديل.\n');
  }

  if (issues.length > 0) {
    console.log(`\n⚠️  أسئلة تحتاج إصلاح (${issues.length}):\n`);
    issues.forEach((q, i) => {
      console.log(`[${i+1}] ID: ${q.id}`);
      console.log(`    السؤال : ${q.question_text}`);
      if (q.answerNeedsFix)
        console.log(`    الإجابة: "${q.old_answer}"  →  "${q.new_answer}"`);
      if (q.optsNeedFix)
        console.log(`    الخيارات: ${JSON.stringify(q.old_opts)} → ${JSON.stringify(q.new_opts)}`);
      console.log();
    });
  }

  if (unknown.length > 0) {
    console.log(`\n❓ أسئلة بقيمة غير معروفة (${unknown.length}):\n`);
    unknown.forEach((q, i) => {
      console.log(`[${i+1}] ID: ${q.id} | الإجابة: "${q.current}" | ${q.question_text}`);
    });
    console.log();
  }

  // ===================================================
  // تطبيق الإصلاحات
  // ===================================================
  if (issues.length === 0) {
    console.log('✅ لا يوجد شيء يحتاج إصلاح. انتهى.\n');
    return;
  }

  console.log('=' .repeat(80));
  console.log(`\n🔧 جاري إصلاح ${issues.length} سؤال...\n`);

  let successCount = 0;
  let failCount = 0;

  for (const q of issues) {
    const updatePayload = {};
    if (q.answerNeedsFix) updatePayload.correct_answer = q.new_answer;
    if (q.optsNeedFix)    updatePayload.options = q.new_opts;

    const { error } = await supabase
      .from('questions')
      .update(updatePayload)
      .eq('id', q.id);

    if (error) {
      console.error(`  ❌ فشل إصلاح ID ${q.id}: ${error.message}`);
      failCount++;
    } else {
      console.log(`  ✅ تم إصلاح ID ${q.id}: "${q.old_answer}" → "${q.new_answer}"`);
      successCount++;
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log(`\n📋 ملخص النتائج:`);
  console.log(`   ✅ تم إصلاح بنجاح : ${successCount}`);
  console.log(`   ❌ فشل الإصلاح    : ${failCount}`);
  console.log(`   ❓ قيم غير معروفة  : ${unknown.length}`);
  console.log('\nانتهت العملية ✨\n');
}

main();
