import { readFileSync } from 'fs'
const env = readFileSync('.env.local', 'utf8')
console.log('File content:')
console.log(env)
console.log('\nParsed:')
env.split('\n').forEach((line, i) => {
  console.log(Line ${i}: "${line}")
})