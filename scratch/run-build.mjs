import { spawn } from 'child_process'
import { writeFileSync } from 'fs'

const cmd = spawn('npm', ['run', 'build'], { shell: true })

let output = ''

cmd.stdout.on('data', (data) => {
  output += data.toString()
  console.log(data.toString())
})

cmd.stderr.on('data', (data) => {
  output += data.toString()
  console.error(data.toString())
})

cmd.on('close', (code) => {
  output += `\nProcess exited with code ${code}\n`
  writeFileSync('build_output.txt', output)
  process.exit(code)
})
