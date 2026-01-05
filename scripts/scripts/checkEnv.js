import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env.local');
console.log('📁 Checking file at:', envPath);
console.log('File exists:', fs.existsSync(envPath));

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  console.log('\n📄 File content (raw):');
  console.log('---');
  console.log(content);
  console.log('---');
  
  console.log('\n🔍 First few characters as codes:');
  for (let i = 0; i < Math.min(10, content.length); i++) {
    console.log(  Position ${i}: '${content[i]}' (code: ${content.charCodeAt(i)}));
  }
} else {
  console.log('❌ .env.local file NOT FOUND!');
}