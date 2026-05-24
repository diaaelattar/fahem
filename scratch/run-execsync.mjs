import { execSync } from 'child_process'
import { writeFileSync } from 'fs'

try {
  console.log('Starting sync build...')
  const output = execSync('npm run build', { encoding: 'utf-8', stdio: 'pipe' })
  writeFileSync('build_execsync.txt', output)
  console.log('Build completed successfully and output written.')
} catch (error) {
  const result = {
    message: error.message,
    stdout: error.stdout,
    stderr: error.stderr
  }
  writeFileSync('build_execsync_error.txt', JSON.stringify(result, null, 2))
  console.error('Build failed.')
}
