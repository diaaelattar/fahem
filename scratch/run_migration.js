const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function run() {
  const client = new Client({ 
    host: 'aws-1-eu-central-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    user: 'postgres.ekhsbwcdenmfokmzafzw',
    password: 'D#8291947dhs',
    ssl: { rejectUnauthorized: false }
  });
  try {
    await client.connect();
    console.log("Connected to PostgreSQL database successfully.");

    const migrationFile = path.join(__dirname, '../supabase/migrations/20260527000001_group_sessions_attendance.sql');
    console.log("Reading migration file:", migrationFile);
    const sql = fs.readFileSync(migrationFile, 'utf8');

    console.log("Executing SQL...");
    await client.query(sql);
    console.log("Migration executed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
