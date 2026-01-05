import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// خواندن فایل .env.local به روش مطمئن‌تر
function loadEnvFile() {
  const envPath = path.resolve(process.cwd(), '.env.local')
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ Error: .env.local file not found at', envPath)
    process.exit(1)
  }

  const content = fs.readFileSync(envPath, 'utf8')
  const env = {}
  
  content.split('\n').forEach(line => {
    // حذف فضاهای خالی و خطوط کامنت
    const trimmedLine = line.trim()
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const firstEquals = trimmedLine.indexOf('=')
      if (firstEquals > 0) {
        const key = trimmedLine.substring(0, firstEquals).trim()
        const value = trimmedLine.substring(firstEquals + 1).trim()
        env[key] = value
      }
    }
  })
  
  return env
}

// بارگیری متغیرهای محیطی
console.log('📁 Loading environment variables...')
const env = loadEnvFile()

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY

// دیباگ: نمایش کلیدهای یافت شده
console.log('🔍 Found keys:', Object.keys(env))
console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Found' : '❌ Missing')
console.log('SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? '✅ Found (' + serviceRoleKey.substring(0, 10) + '...)' : '❌ Missing')

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Error: Missing required environment variables')
  console.log('\n📄 Content of .env.local:')
  console.log('---')
  console.log(fs.readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf8'))
  console.log('---')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

// ادامه کدهای اصلی شما (بدون تغییر)...
async function setupPolicies() {
  console.log('🚀 Starting RLS policies setup...')

  try {
    // ==================== جدول profiles ====================
    console.log('\n📋 Setting up policies for "profiles" table...')
    
    // بقیه کدهای شما...
    // [کدهای اصلی setupPolicies.js را اینجا قرار دهید]
    
    console.log('\n🎉 All RLS policies have been successfully configured!')
    
  } catch (error) {
    console.error('❌ Error setting up policies:', error.message)
    console.error('Full error:', error)
    process.exit(1)
  }
}

// اجرای اسکریپت
setupPolicies()