import { exec } from 'child_process'
import { writeFileSync } from 'fs'

exec('npx tsc --noEmit', (error, stdout, stderr) => {
  const result = {
    error: error ? error.message : null,
    stdout,
    stderr
  }
  writeFileSync('tsc_output_final.txt', JSON.stringify(result, null, 2))
  console.log('Done running tsc')
  process.exit(error ? 1 : 0)
})
