import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres.ekhsbwcdenmfokmzafzw:D%238291947dhs@aws-1-eu-central-1.pooler.supabase.com:5432/postgres';

async function verify() {
  console.log('Connecting to database to verify RLS status...');
  const client = new Client({ connectionString });
  await client.connect();

  const query = `
    SELECT 
      c.relname AS table_name,
      c.relrowsecurity AS rls_enabled
    FROM 
      pg_class c
    JOIN 
      pg_namespace n ON n.oid = c.relnamespace
    WHERE 
      n.nspname = 'public' 
      AND c.relkind = 'r'
    ORDER BY 
      table_name;
  `;

  try {
    const res = await client.query(query);
    const tables = res.rows;

    console.log('\n======================================================');
    console.log('🛡️  جدول فحص سياسات الأمان Row Level Security (RLS) 🛡️');
    console.log('======================================================\n');

    let insecureTables = [];
    
    // Print RLS Status
    console.log(String.prototype.padEnd ? 
      `${'Table Name'.padEnd(35)} | ${'RLS Status'}` : 
      'Table Name | RLS Status'
    );
    console.log('------------------------------------------------------');

    for (const table of tables) {
      const status = table.rls_enabled ? '✅ SECURE' : '❌ INSECURE (RLS Disabled)';
      if (!table.rls_enabled) {
        insecureTables.push(table.table_name);
      }
      console.log(String.prototype.padEnd ? 
        `${table.table_name.padEnd(35)} | ${status}` : 
        `${table.table_name} | ${status}`
      );
    }

    console.log('\n======================================================');
    if (insecureTables.length > 0) {
      console.error(`🚨 خطير: تم العثور على عدد ${insecureTables.length} جداول غير محمية بنظام RLS!`);
      console.error('الجداول غير المحمية:', insecureTables.join(', '));
      console.error('يرجى تفعيل RLS فوراً باستخدام: ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;');
      console.log('======================================================\n');
      process.exit(1);
    } else {
      console.log('🎉 ممتاز! جميع جداول قاعدة البيانات محمية بنظام RLS بنجاح.');
      console.log('======================================================\n');
      process.exit(0);
    }
  } catch (error) {
    console.error('Failed to run RLS verification query:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

verify();
