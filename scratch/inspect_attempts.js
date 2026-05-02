const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.from('exam_attempts').select('*').limit(1);
  if (error) {
    console.error(error);
  } else if (data && data.length > 0) {
    console.log("Columns:", Object.keys(data[0]));
    console.log("Sample Data:", data[0]);
  } else {
    console.log("No data found in exam_attempts.");
  }
}
run();
