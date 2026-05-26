import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres.ekhsbwcdenmfokmzafzw:D%238291947dhs@aws-1-eu-central-1.pooler.supabase.com:5432/postgres';

// performance_reports is an admin-only aggregate report table (no student_id column)
// RLS policy: admins can read/write, service_role has full access
const sql = `
ALTER TABLE public.performance_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage all performance reports" ON public.performance_reports;
CREATE POLICY "Admins manage all performance reports" ON public.performance_reports
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Service role full access performance reports" ON public.performance_reports;
CREATE POLICY "Service role full access performance reports" ON public.performance_reports
  FOR ALL USING (auth.role() = 'service_role');
`;

async function run() {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    await client.query(sql);
    console.log('SUCCESS: RLS enabled on performance_reports with admin-only policy!');
  } catch (e) {
    console.error('ERROR:', e.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
