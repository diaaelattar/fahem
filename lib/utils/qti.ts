/**
 * QTI 2.1 Utility for Exporting and Importing Questions
 */

export interface QuestionData {
  id?: string
  question_type: 'mcq' | 'true_false' | 'fill_blank' | 'essay'
  question_text: string
  options?: string[] | null
  correct_answer: string
  explanation?: string | null
  difficulty_level?: 'easy' | 'medium' | 'hard'
  bloom_level?: string
  points?: number
}

// Helper to escape XML special characters
function escapeXml(unsafe: string): string {
  if (!unsafe) return ''
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// Generate QTI XML for a list of questions
export function exportToQtiXml(questions: QuestionData[]): string {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`
  xml += `<assessmentItems xmlns="http://www.imsglobal.org/xsd/imsqti_v2p1">\n`

  questions.forEach((q, index) => {
    const id = q.id || `q-${Date.now()}-${index}`
    const points = q.points || 1
    const difficulty = q.difficulty_level || 'medium'
    const bloom = q.bloom_level || 'understand'
    const title = q.question_text.substring(0, 50).replace(/<[^>]*>/g, '') + '...'

    xml += `  <assessmentItem identifier="${id}" title="${escapeXml(title)}" adaptive="false" timeDependent="false" difficulty="${difficulty}" bloom="${bloom}" points="${points}">\n`

    if (q.question_type === 'mcq') {
      const opts = q.options || []
      const correctIndex = opts.indexOf(q.correct_answer)
      const correctId = correctIndex !== -1 ? `choice_${correctIndex}` : 'choice_0'

      xml += `    <responseDeclaration identifier="RESPONSE" cardinality="single" baseType="identifier">\n`
      xml += `      <correctResponse>\n`
      xml += `        <value>${correctId}</value>\n`
      xml += `      </correctResponse>\n`
      xml += `    </responseDeclaration>\n`
      xml += `    <outcomeDeclaration identifier="SCORE" cardinality="single" baseType="float"/>\n`
      xml += `    <itemBody>\n`
      xml += `      <prompt>${escapeXml(q.question_text)}</prompt>\n`
      xml += `      <choiceInteraction responseIdentifier="RESPONSE" shuffle="false" maxChoices="1">\n`
      opts.forEach((opt, oIdx) => {
        xml += `        <simpleChoice identifier="choice_${oIdx}">${escapeXml(opt)}</simpleChoice>\n`
      })
      xml += `      </choiceInteraction>\n`
      xml += `    </itemBody>\n`
    } else if (q.question_type === 'true_false') {
      const correctId = q.correct_answer === 'صح' ? 'choice_true' : 'choice_false'

      xml += `    <responseDeclaration identifier="RESPONSE" cardinality="single" baseType="identifier">\n`
      xml += `      <correctResponse>\n`
      xml += `        <value>${correctId}</value>\n`
      xml += `      </correctResponse>\n`
      xml += `    </responseDeclaration>\n`
      xml += `    <outcomeDeclaration identifier="SCORE" cardinality="single" baseType="float"/>\n`
      xml += `    <itemBody>\n`
      xml += `      <prompt>${escapeXml(q.question_text)}</prompt>\n`
      xml += `      <choiceInteraction responseIdentifier="RESPONSE" shuffle="false" maxChoices="1">\n`
      xml += `        <simpleChoice identifier="choice_true">صح</simpleChoice>\n`
      xml += `        <simpleChoice identifier="choice_false">خطأ</simpleChoice>\n`
      xml += `      </choiceInteraction>\n`
      xml += `    </itemBody>\n`
    } else if (q.question_type === 'fill_blank') {
      xml += `    <responseDeclaration identifier="RESPONSE" cardinality="single" baseType="string">\n`
      xml += `      <correctResponse>\n`
      xml += `        <value>${escapeXml(q.correct_answer)}</value>\n`
      xml += `      </correctResponse>\n`
      xml += `    </responseDeclaration>\n`
      xml += `    <outcomeDeclaration identifier="SCORE" cardinality="single" baseType="float"/>\n`
      xml += `    <itemBody>\n`
      xml += `      <prompt>${escapeXml(q.question_text)}</prompt>\n`
      xml += `      <textEntryInteraction responseIdentifier="RESPONSE" expectedLength="25" />\n`
      xml += `      <correctAnswerFeedback>${escapeXml(q.correct_answer)}</correctAnswerFeedback>\n`
      xml += `    </itemBody>\n`
    } else {
      // Essay / default
      xml += `    <responseDeclaration identifier="RESPONSE" cardinality="single" baseType="string"/>\n`
      xml += `    <outcomeDeclaration identifier="SCORE" cardinality="single" baseType="float"/>\n`
      xml += `    <itemBody>\n`
      xml += `      <prompt>${escapeXml(q.question_text)}</prompt>\n`
      xml += `      <extendedTextInteraction responseIdentifier="RESPONSE" expectedLines="5"/>\n`
      xml += `      <rubricBlock>\n`
      xml += `        <p>الإجابة النموذجية: ${escapeXml(q.correct_answer)}</p>\n`
      xml += `      </rubricBlock>\n`
      xml += `    </itemBody>\n`
    }

    if (q.explanation) {
      xml += `    <modalFeedback outcomeIdentifier="FEEDBACK" identifier="COMMENT" showHide="show">\n`
      xml += `      ${escapeXml(q.explanation)}\n`
      xml += `    </modalFeedback>\n`
    }

    xml += `  </assessmentItem>\n`
  })

  xml += `</assessmentItems>`
  return xml
}

// Parse QTI XML into a list of questions
export function parseQtiXml(xmlText: string): QuestionData[] {
  const parser = new DOMParser()
  const xmlDoc = parser.parseFromString(xmlText, 'application/xml')
  
  // check for parse errors
  const parserError = xmlDoc.querySelector('parsererror')
  if (parserError) {
    throw new Error('فشل تحليل ملف XML: تنسيق غير صحيح أو ملف معطوب')
  }

  const items = xmlDoc.getElementsByTagName('assessmentItem')
  const questions: QuestionData[] = []

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const id = item.getAttribute('identifier') || undefined
    const difficulty = (item.getAttribute('difficulty') as any) || 'medium'
    const bloom = item.getAttribute('bloom') || 'understand'
    const points = parseInt(item.getAttribute('points') || '1', 10)

    const promptEl = item.querySelector('prompt')
    if (!promptEl) continue // Skip if no question text
    const questionText = promptEl.textContent || ''

    // Determine type by checking interactions
    let type: 'mcq' | 'true_false' | 'fill_blank' | 'essay' = 'essay'
    let options: string[] | null = null
    let correctAnswer = ''

    const choiceInteraction = item.querySelector('choiceInteraction')
    const textEntryInteraction = item.querySelector('textEntryInteraction')

    if (choiceInteraction) {
      const choices = Array.from(choiceInteraction.querySelectorAll('simpleChoice'))
      const responseDecl = item.querySelector('responseDeclaration[identifier="RESPONSE"]')
      const correctValEl = responseDecl?.querySelector('correctResponse value')
      const correctId = correctValEl?.textContent || ''

      const choiceTexts = choices.map(c => c.textContent || '')
      
      // Check if it's true/false or mcq
      const isTrueFalse = choices.length === 2 && 
        ((choiceTexts.includes('صح') && choiceTexts.includes('خطأ')) ||
         (choiceTexts.includes('True') && choiceTexts.includes('False')))

      if (isTrueFalse) {
        type = 'true_false'
        const correctChoice = choices.find(c => c.getAttribute('identifier') === correctId)
        const correctText = correctChoice?.textContent || ''
        correctAnswer = correctText.includes('True') || correctText.includes('صح') ? 'صح' : 'خطأ'
      } else {
        type = 'mcq'
        options = choiceTexts
        const correctChoice = choices.find(c => c.getAttribute('identifier') === correctId)
        correctAnswer = correctChoice?.textContent || ''
      }
    } else if (textEntryInteraction) {
      type = 'fill_blank'
      const responseDecl = item.querySelector('responseDeclaration[identifier="RESPONSE"]')
      const correctValEl = responseDecl?.querySelector('correctResponse value')
      correctAnswer = correctValEl?.textContent || ''
      if (!correctAnswer) {
        const feedbackEl = item.querySelector('correctAnswerFeedback')
        correctAnswer = feedbackEl?.textContent || ''
      }
    } else {
      type = 'essay'
      // Look in rubric block or response declaration
      const rubricText = item.querySelector('rubricBlock')?.textContent || ''
      const match = rubricText.match(/الإجابة النموذجية:\s*(.*)/)
      if (match && match[1]) {
        correctAnswer = match[1].trim()
      } else {
        // Fallback
        const responseDecl = item.querySelector('responseDeclaration[identifier="RESPONSE"]')
        const correctValEl = responseDecl?.querySelector('correctResponse value')
        correctAnswer = correctValEl?.textContent || 'إجابة مقالية نموذجية'
      }
    }

    const explanationEl = item.querySelector('modalFeedback')
    const explanation = explanationEl ? explanationEl.textContent?.trim() : null

    questions.push({
      id,
      question_type: type,
      question_text: questionText.trim(),
      options,
      correct_answer: correctAnswer.trim(),
      explanation,
      difficulty_level: difficulty,
      bloom_level: bloom,
      points,
    })
  }

  return questions
}
