import fs from 'fs';
import path from 'path';

function checkEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    console.log('.env.local does not exist');
    return;
  }
  const content = fs.readFileSync(envPath, 'utf-8');
  const vars = [];
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?/);
    if (match) {
      const key = match[1];
      const val = match[2]?.trim() ?? '';
      vars.push(`${key}: ${val ? 'SET (length: ' + val.length + ')' : 'EMPTY'}`);
    }
  });
  console.log('Variables in .env.local:');
  console.log(vars.join('\n'));
}
checkEnv();
