import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const VALID_DIFFICULTY = ['easy', 'medium', 'hard']
const VALID_BLOOM = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create']

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin')
      return NextResponse.json({ error: 'للمديرين فقط' }, { status: 403 })

    const { questionId, suggestions } = await request.json()
    if (!questionId || !suggestions)
      return NextResponse.json({ error: 'البيانات غير مكتملة' }, { status: 400 })

    // Build safe update payload (only include valid fields)
    const update: Record<string, any> = {
      is_approved: true,
      status: 'approved',
      updated_at: new Date().toISOString(),
    }

    if (typeof suggestions.question_text === 'string' && suggestions.question_text.trim())
      update.question_text = suggestions.question_text.trim()

    if (typeof suggestions.correct_answer === 'string' && suggestions.correct_answer.trim())
      update.correct_answer = suggestions.correct_answer.trim()

    if (typeof suggestions.explanation === 'string' && suggestions.explanation.trim())
      update.explanation = suggestions.explanation.trim()

    if (VALID_DIFFICULTY.includes(suggestions.difficulty_level))
      update.difficulty_level = suggestions.difficulty_level

    if (VALID_BLOOM.includes(suggestions.bloom_level))
      update.bloom_level = suggestions.bloom_level

    if (Array.isArray(suggestions.options) && suggestions.options.length > 0)
      update.options = suggestions.options

    if (Array.isArray(suggestions.tags) && suggestions.tags.length > 0)
      update.tags = suggestions.tags

    const { error } = await supabase.from('questions').update(update).eq('id', questionId)
    if (error) throw error

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('[audit/apply] Error:', error)
    return NextResponse.json({ error: error.message || 'حدث خطأ أثناء حفظ التعديلات' }, { status: 500 })
  }
}
