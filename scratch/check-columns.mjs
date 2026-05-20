import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function checkColumns() {
  const { data, error } = await supabase.rpc('inspect_table_columns', { table_name: 'exam_attempts' })
  
  if (error) {
    // Fallback: run a direct postgres query
    const { data: cols, error: pgError } = await supabase.from('exam_attempts').select('*').limit(1)
    if (pgError) {
      console.error("Error querying table:", pgError.message)
    } else if (cols && cols.length > 0) {
      console.log("Columns in exam_attempts:", Object.keys(cols[0]))
    } else {
      console.log("No rows in exam_attempts, trying to fetch schema info...")
      // Try to select column names via information_schema
      const { data: schemaCols, error: schemaError } = await supabase.rpc('exec_sql', {
        sql_query: "SELECT column_name FROM information_schema.columns WHERE table_name = 'exam_attempts'"
      })
      if (schemaError) {
        console.error("Schema error:", schemaError.message)
      } else {
        console.log("Schema columns:", schemaCols)
      }
    }
  } else {
    console.log("Columns:", data)
  }
}

checkColumns()
