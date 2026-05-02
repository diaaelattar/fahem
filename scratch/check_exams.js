const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data } = await supabase.from('exam_attempts').select('id, score, percentage, is_passed, exams(passing_score, total_points)');
  for (const attempt of data) {
    if (!attempt.is_passed && attempt.percentage >= 50 && attempt.score > 0) {
      console.log(`Fixing attempt ${attempt.id} to is_passed=true (Score: ${attempt.score}, Pct: ${attempt.percentage})`);
      await supabase.from('exam_attempts').update({ is_passed: true }).eq('id', attempt.id);
    }
  }
}
run();
