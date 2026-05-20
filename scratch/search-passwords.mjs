import fs from 'fs';
import path from 'path';

const searchDir = 'c:\\Users\\diaa_elattar\\Downloads\\istabaq-egypt-complete';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules' && file !== '.next') {
        results = results.concat(walk(filePath));
      }
    } else {
      if (file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.json') || file.endsWith('.env') || file.endsWith('.local') || file.endsWith('.txt') || file.endsWith('.html') || file.endsWith('.md')) {
        results.push(filePath);
      }
    }
  });
  return results;
}

const files = walk(searchDir);
console.log(`Found ${files.length} text files to search.`);

for (const file of files) {
  try {
    const content = fs.readFileSync(file, 'utf-8');
    if (content.includes('postgresql://') || content.includes('postgres://')) {
      console.log(`Found DB URL in file: ${file}`);
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (line.includes('postgres') && (line.includes('//') || line.includes(':'))) {
          console.log(`  Line ${index + 1}: ${line.trim()}`);
        }
      });
    }
  } catch (err) {
    // Ignore errors
  }
}
