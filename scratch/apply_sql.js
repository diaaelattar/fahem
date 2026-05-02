const fs = require('fs');
const { Client } = require('pg');

async function applySql() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("No DATABASE_URL found in environment variables.");
    return;
  }
  
  const client = new Client({ 
    connectionString,
    ssl: { rejectUnauthorized: false } // Required for some hosted postgres
  });

  try {
    await client.connect();
    console.log("Connected to database successfully.");
    
    // Read the migration file
    const sql = fs.readFileSync('supabase/migrations/20260417000001_fix_passing_and_review_logic.sql', 'utf8');
    
    // Execute SQL
    await client.query(sql);
    console.log("Migration executed successfully!");
    
    // Explicitly fix past failed attempts with percentage >= 50
    const fixResult = await client.query(`
      UPDATE public.exam_attempts 
      SET is_passed = true 
      WHERE percentage >= 50 AND is_passed = false AND score > 0;
    `);
    console.log(`Updated ${fixResult.rowCount} existing failed attempts to 'Passed'.`);

  } catch (err) {
    console.error("Error applying SQL migration:", err);
  } finally {
    await client.end();
  }
}

applySql();
