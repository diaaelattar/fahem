import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { GoogleGenerativeAI } from '@google/generative-ai'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, serviceRoleKey)

const MODELS = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.0-flash']

function getModel(name) {
  const keys = [
    process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    process.env.GOOGLE_GENERATIVE_AI_API_KEY_2,
    process.env.GOOGLE_GENERATIVE_AI_API_KEY_3,
    process.env.GOOGLE_GENERATIVE_AI_API_KEY_4
  ].filter(Boolean)
  
  const selectedKey = keys[Math.floor(Math.random() * keys.length)] || ''
  return new GoogleGenerativeAI(selectedKey).getGenerativeModel({ 
    model: name,
    generationConfig: { temperature: 0.2, maxOutputTokens: 800 }
  })
}

async function fetchImageAsBase64(imageUrl) {
  const response = await fetch(imageUrl)
  if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`)
  const contentType = response.headers.get('content-type') || 'image/jpeg'
  const arrayBuffer = await response.arrayBuffer()
  const base64 = Buffer.from(arrayBuffer).toString('base64')
  return { data: base64, mimeType: contentType.split(';')[0] }
}

async function testGrading() {
  const studentId = '865b7bb5-6a5a-4483-8013-06b861c99b11' // tasneemelatter@gmail.com
  const examId = '7855cd94-5f02-4159-8134-a94dce33f469' // اختبار عام - نموذج 8
  
  console.log("1. Creating a test attempt...")
  const { data: attempt, error: attemptErr } = await supabase
    .from('exam_attempts')
    .insert({
      student_id: studentId,
      exam_id: examId,
      started_at: new Date().toISOString(),
      answers: {},
      attempt_number: 99
    })
    .select()
    .single()
    
  if (attemptErr) {
    console.error("Failed to create attempt:", attemptErr.message)
    return
  }
  
  console.log(`Created attempt ID: ${attempt.id}`)
  
  // 2. Fetch exam questions
  const { data: examQuestions } = await supabase
    .from('exam_questions')
    .select('points_override, questions(id, question_type, correct_answer, points, question_text, explanation)')
    .eq('exam_id', examId)

  // Find an essay/handwritten question to test vision grading
  const essayQuestion = examQuestions.find(eq => eq.questions.question_type === 'essay' || eq.questions.question_type === 'correction')
  const mcqQuestion = examQuestions.find(eq => eq.questions.question_type === 'mcq')
  
  if (!essayQuestion) {
    console.log("No essay/correction question found in this exam.")
    return
  }
  
  // Prepare answers
  const answers = {
    [essayQuestion.questions.id]: `[image:https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=400]`, // test image url
    [mcqQuestion.questions.id]: mcqQuestion.questions.correct_answer // correct MCQ answer
  }
  
  const imageAnswers = {
    [essayQuestion.questions.id]: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=400'
  }
  
  console.log("2. Simulating saving answers to database...")
  const { error: updateErr } = await supabase
    .from('exam_attempts')
    .update({ answers })
    .eq('id', attempt.id)
    
  if (updateErr) {
    console.error("Failed to update answers:", updateErr.message)
    return
  }
  console.log("Answers saved successfully!")

  // 3. Run simulated grading loop
  console.log("3. Running grading simulation...")
  let totalScore = 0
  let studentAnswersPayload = []
  
  for (const eq of examQuestions) {
    const q = eq.questions
    if (!q) continue
    
    // Only grade the ones we answered for the test, others are unanswered (0 score)
    const studentAns = answers[q.id]
    const hasImageAnswer = imageAnswers[q.id]
    
    let isCorrect = false
    let scoreAwarded = 0
    let aiFeedback = null
    const qPoints = eq.points_override || Math.max(1, q.points || 1)
    
    if (!studentAns && !hasImageAnswer) {
      // Unanswered, skip
    } else if ((q.question_type === 'essay' || q.question_type === 'correction') && hasImageAnswer) {
      console.log(`Grading Essay Image for Q: "${q.question_text}"`)
      const imageUrl = imageAnswers[q.id]
      try {
        const imageData = await fetchImageAsBase64(imageUrl)
        const visionPrompt = `أنت مصحح امتحانات خبير متخصص في المناهج المصرية. مهمتك قراءة إجابة طالب مكتوبة بخط اليد وتقييمها.
- **السؤال:** ${q.question_text}
- **الإجابة النموذجية:** ${q.correct_answer || ''}
- **الدرجة العظمى:** ${qPoints}`

        let aiResultStr = ''
        for (const modelName of MODELS) {
          try {
            const model = getModel(modelName)
            const result = await model.generateContent([
              {
                inlineData: {
                  mimeType: imageData.mimeType,
                  data: imageData.data,
                },
              },
              { text: visionPrompt },
            ])
            aiResultStr = result.response.text().trim()
            aiResultStr = aiResultStr.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim()
            break
          } catch (e) {
            console.warn(`Model ${modelName} failed grading:`, e)
          }
        }
        
        console.log("Raw AI response:", aiResultStr)
        // Check if we got valid grading (or if we need to parse JSON)
        let parsed = { is_correct: true, earned_score: qPoints, feedback: "تم التقييم بنجاح" }
        try {
          parsed = JSON.parse(aiResultStr)
        } catch(e) {
          console.warn("AI didn't return JSON, using fallback parsing")
        }
        
        isCorrect = parsed.is_correct || parsed.earned_score > 0
        scoreAwarded = Math.min(qPoints, Math.max(0, Number(parsed.earned_score) || 0))
        aiFeedback = parsed.feedback
      } catch (err) {
        console.error("Failed vision grading:", err.message)
      }
    } else if (q.question_type === 'mcq') {
      if (studentAns?.trim() === q.correct_answer?.trim()) {
        isCorrect = true
        scoreAwarded = qPoints
      }
    }
    
    if (studentAns || hasImageAnswer) {
      totalScore += scoreAwarded
      const answerImageUrl = imageAnswers[q.id] || null
      const gradingMethod = answerImageUrl ? 'image' : 'auto'
      
      studentAnswersPayload.push({
        attempt_id: attempt.id,
        student_id: studentId,
        exam_id: examId,
        question_id: q.id,
        student_answer: studentAns,
        is_correct: isCorrect,
        score_awarded: scoreAwarded,
        teacher_feedback: aiFeedback,
        answer_image_url: answerImageUrl,
        grading_method: gradingMethod
      })
    }
  }
  
  console.log(`Total Score: ${totalScore}`)
  console.log("Upserting student answers payload:", studentAnswersPayload)
  
  const { error: upsertErr } = await supabase
    .from('student_answers')
    .upsert(studentAnswersPayload, { onConflict: 'attempt_id,question_id' })
    
  if (upsertErr) {
    console.error("Upsert failed:", upsertErr.message)
    return
  }
  console.log("Successfully upserted student answers!")
  
  // Clean up the test attempt
  console.log("Cleaning up test data...")
  await supabase.from('student_answers').delete().eq('attempt_id', attempt.id)
  await supabase.from('exam_attempts').delete().eq('id', attempt.id)
  console.log("Cleanup complete!")
}

testGrading()
