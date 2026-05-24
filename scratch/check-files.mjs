import fs from 'fs'
console.log('Files in current directory:')
console.log(fs.readdirSync('.').filter(f => f.includes('txt') || f.includes('log') || f.includes('json')))
