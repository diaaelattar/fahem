import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

function loadEnv() {
  const content = fs.readFileSync('.env.local', 'utf-8')
  content.split('\n').forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?/)
    if (match) process.env[match[1]] = match[2]?.trim() ?? ''
  })
}
loadEnv()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// الأسئلة الـ 5 التي تحتوي على "صواب" - تعني صحيح
const ids = [
  '474e0c12-6925-4a6a-b807-f30347610d37',
  'f857e615-c9bc-4aa7-849a-b1ff7858ab25',
  'ab9c121e-9b40-488c-9fba-44bb9665425e',
  '70ed0feb-e103-4011-b428-ed08201275d8',
  '3d0ac964-e0ab-425d-bb2f-4b5aab542026',
]

console.log('🔧 إصلاح الأسئلة الـ 5 التي تحتوي على "صواب"...\n')

let success = 0
for (const id of ids) {
  // أيضاً إصلاح الخيارات إذا كانت تحتوي على "صواب"
  const { data: q } = await supabase
    .from('questions')
    .select('id, correct_answer, options')
    .eq('id', id)
    .single()

  if (!q) {
    console.log(`❓ لم يُعثر على ID: ${id}`)
    continue
  }

  const fixedAnswer = 'صح'
  const fixedOptions = Array.isArray(q.options)
    ? q.options.map((o) => {
        const v = (o || '').trim()
        if (['صواب', 'صح', 'صحيح', 'true', 'True', 'TRUE'].includes(v))
          return 'صح'
        if (
          [
            'خطأ',
            'خاطئة',
            'خاطئ',
            'false',
            'False',
            'FALSE',
            'ب',
            'خ',
          ].includes(v)
        )
          return 'خطأ'
        return o
      })
    : q.options

  const { error } = await supabase
    .from('questions')
    .update({ correct_answer: fixedAnswer, options: fixedOptions })
    .eq('id', id)

  if (error) {
    console.log(`❌ فشل ID ${id}: ${error.message}`)
  } else {
    console.log(`✅ تم إصلاح ID ${id}: "${q.correct_answer}" → "صح"`)
    if (JSON.stringify(q.options) !== JSON.stringify(fixedOptions))
      console.log(
        `   الخيارات: ${JSON.stringify(q.options)} → ${JSON.stringify(fixedOptions)}`
      )
    success++
  }
}

console.log(`\n✨ تم إصلاح ${success} من 5 أسئلة بنجاح!`)
