import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  const conten = fs.readFileSync(envPath, 'utf-8');
  conten.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      process.env[match[1]] = match[2] ? match[2].trim() : '';
    }
  });
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key);

async function checkAndCreateBucket() {
  console.log("Checking storage buckets...");
  const { data: buckets, error } = await supabase.storage.listBuckets();
  
  if (error) {
    console.error("Error listing buckets:", error);
    return;
  }

  const bucketName = 'documents';
  const exists = buckets.find(b => b.name === bucketName);

  if (exists) {
    console.log(`Bucket '${bucketName}' already exists. Updating it to be public...`);
    const { error: updateError } = await supabase.storage.updateBucket(bucketName, {
      public: true,
      allowedMimeTypes: ['image/*', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'audio/*', 'video/*'],
      fileSizeLimit: 104857600
    });
    if (updateError) {
      console.log("Could not update bucket to public:", updateError);
    } else {
        console.log("Bucket updated successfully.");
    }
    return;
  }

  console.log(`Bucket '${bucketName}' not found. Creating...`);
  const { data, error: createError } = await supabase.storage.createBucket(bucketName, {
    public: true,
    allowedMimeTypes: ['image/*', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'audio/*', 'video/*'],
  });

  if (createError) {
    console.error("Failed to create bucket:", createError);
  } else {
    console.log(`Bucket '${bucketName}' created successfully!`);
  }
}

checkAndCreateBucket();
