import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Client } = pg;
const connectionString = 'postgresql://postgres.ekhsbwcdenmfokmzafzw:D%238291947dhs@aws-1-eu-central-1.pooler.supabase.com:5432/postgres';

const sqlPath = './supabase/migrations/20260601000003_school_registrations.sql';
const sql = fs.readFileSync(sqlPath, 'utf8');

async function run() {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    await client.query(sql);
    console.log('SUCCESS: school_registrations migration applied successfully!');
  } catch (e) {
    console.error('ERROR applying migration:', e.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
