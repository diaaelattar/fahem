import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join, extname } from 'path'

const ROOT = process.cwd()

function getAllFiles(dir, files = []) {
  const entries = readdirSync(dir)
  for (const entry of entries) {
    const full = join(dir, entry)
    if (entry === 'node_modules' || entry === '.next' || entry === '.git') continue
    const stat = statSync(full)
    if (stat.isDirectory()) {
      getAllFiles(full, files)
    } else if (['.ts', '.tsx'].includes(extname(entry))) {
      files.push(full)
    }
  }
  return files
}

const files = getAllFiles(join(ROOT, 'app'))
let fixedCount = 0

for (const file of files) {
  let content = readFileSync(file, 'utf-8')
  
  // Skip client components
  if (!content.includes("from '@/lib/supabase/server'")) continue
  
  let changed = false
  
  // Fix: const supabase = createClient() → const supabase = await createClient()
  if (content.includes('const supabase = createClient()') && !content.includes('const supabase = await createClient()')) {
    content = content.replace(/const supabase = createClient\(\)/g, 'const supabase = await createClient()')
    changed = true
  }

  if (changed) {
    writeFileSync(file, content, 'utf-8')
    console.log(`✅ Fixed: ${file.replace(ROOT, '')}`)
    fixedCount++
  }
}

console.log(`\n✅ Done! Fixed ${fixedCount} file(s).`)
