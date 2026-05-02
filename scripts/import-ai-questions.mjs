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

// ==========================================
// إعدادات الاستيراد
// ==========================================
// قم بتحديد المادة والصف الذي تريد إدراج الأسئلة لهما
const SUBJECT_ID = 1; // رقم مادة (مثلاً: الرياضيات)
const GRADE_ID = 4;   // رقم الصف (مثلاً: الأول الإعدادي)
const ADMIN_ID = '6200bce7-bd53-41e0-8bd3-198b9c235641'; // المعرف الخاص بك كمدير

async function importQuestions() {
  try {
    const jsonPath = path.join(process.cwd(), 'ai_questions.json');
    if (!fs.existsSync(jsonPath)) {
      console.error('❌ ملف ai_questions.json غير موجود. يرجى إنشاؤه في المجلد الرئيسي للمشروع ولصق نتيجة الذكاء الاصطناعي بداخله.');
      return;
    }

    const fileContent = fs.readFileSync(jsonPath, 'utf-8');
    const parsedData = JSON.parse(fileContent);
    const questions = parsedData.questions;

    if (!questions || !Array.isArray(questions)) {
      console.error('❌ تنسيق الملف غير صحيح. يجب أن يحتوي على مصفوفة "questions".');
      return;
    }

    console.log(`⏳ جاري إدراج ${questions.length} أسئلة في بنك الأسئلة...`);

    const questionsToInsert = questions.map(q => ({
      admin_id: ADMIN_ID,
      subject_id: SUBJECT_ID,
      grade_id: GRADE_ID,
      question_type: q.type,
      question_text: q.question_text,
      options: q.options || null,
      correct_answer: q.correct_answer,
      explanation: q.explanation || '',
      difficulty_level: q.difficulty || 'medium',
      points: q.points || 1,
      is_approved: true, // سيتم اعتماده تلقائياً
    }));

    const { data, error } = await supabase.from('questions').insert(questionsToInsert).select();

    if (error) {
      console.error('❌ حدث خطأ أثناء إدراج الأسئلة:', error.message);
    } else {
      console.log(`✅ تم إدراج ${data.length} أسئلة بنجاح في بنك الأسئلة!`);
    }

  } catch (err) {
    console.error('❌ خطأ غير متوقع:', err);
  }
}

importQuestions();
