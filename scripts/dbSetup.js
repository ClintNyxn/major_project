import { execFileSync } from 'node:child_process'
import { writeFile } from 'node:fs/promises'

function runSupabase(args) {
  execFileSync('npx', ['supabase', ...args], { stdio: 'inherit' })
}

function parseStatusValue(output, key) {
  const line = output.split('\n').find((entry) => entry.startsWith(`${key}=`))
  if (!line) return ''
  const value = line.slice(key.length + 1).trim()
  return value.startsWith('"') ? JSON.parse(value) : value
}

async function setup() {
  runSupabase(['start'])
  runSupabase(['db', 'reset', '--no-seed'])
  execFileSync(process.execPath, ['supabase/seed/seedCatalog.js'], { stdio: 'inherit' })
  execFileSync(process.execPath, ['scripts/validateFoodData.js'], { stdio: 'inherit' })

  const status = execFileSync('npx', ['supabase', 'status', '--output', 'env'], { encoding: 'utf8' })
  const apiUrl = parseStatusValue(status, 'API_URL')
  const anonKey = parseStatusValue(status, 'ANON_KEY')
  if (!apiUrl || !anonKey) throw new Error('Supabase is running, but its local API URL or anon key was not reported.')

  await writeFile('.env.local', `VITE_SUPABASE_URL=${apiUrl}\nVITE_SUPABASE_ANON_KEY=${anonKey}\n`, { mode: 0o600 })
  console.info('Local catalog is ready. .env.local was generated with the public local anon key.')
}

setup().catch((error) => {
  console.error('Local database setup failed.', error)
  process.exitCode = 1
})
