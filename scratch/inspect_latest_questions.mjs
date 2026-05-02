import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectLatestQuestions() {
  const { data, error } = await supabase
    .from('questions')
    .select('question_text, options, correct_answer, explanation')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching questions:', error);
    return;
  }

  console.log('Latest Questions Content:');
  console.log(JSON.stringify(data, null, 2));
}

inspectLatestQuestions();
