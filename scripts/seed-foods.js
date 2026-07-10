#!/usr/bin/env node
/**
 * Seed public.foods from data/ifct-foods.csv (IFCT 2017 nutrition catalog).
 *
 * Real data: run `npm run build:ifct-csv` first (or use committed data/ifct-foods.csv).
 * Source: National Institute of Nutrition — Indian Food Composition Tables 2017
 *          via https://github.com/ifct2017/compositions
 *
 * Required env (from .env.local or shell):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage:
 *   node scripts/seed-foods.js
 *   node scripts/seed-foods.js --file path/to/custom.csv
 *   node scripts/seed-foods.js --dry-run
 *
 * CSV columns (header row required):
 *   name,category,kcal_per_100g,carbs_g_per_100g,protein_g_per_100g,fat_g_per_100g,fiber_g_per_100g
 */

const fs = require('node:fs')
const path = require('node:path')
const { createClient } = require('@supabase/supabase-js')

const BATCH_SIZE = 500
const DEFAULT_CSV = path.join(process.cwd(), 'data', 'ifct-foods.csv')

const EXPECTED_HEADERS = [
  'name',
  'category',
  'kcal_per_100g',
  'carbs_g_per_100g',
  'protein_g_per_100g',
  'fat_g_per_100g',
  'fiber_g_per_100g',
]

function loadEnvFiles() {
  for (const file of ['.env.local', '.env']) {
    const full = path.join(process.cwd(), file)
    if (!fs.existsSync(full)) continue
    const text = fs.readFileSync(full, 'utf8')
    for (const line of text.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      let value = trimmed.slice(eq + 1).trim()
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      if (process.env[key] === undefined) process.env[key] = value
    }
  }
}

function parseArgs(argv) {
  const args = { file: DEFAULT_CSV, dryRun: false }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--dry-run') args.dryRun = true
    else if (arg === '--file') args.file = path.resolve(argv[++i] ?? '')
    else if (arg === '--help' || arg === '-h') args.help = true
  }
  return args
}

/** Minimal RFC-style CSV line parser (handles quoted fields). */
function parseCsvLine(line) {
  const out = []
  let cur = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        cur += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      out.push(cur)
      cur = ''
    } else {
      cur += ch
    }
  }
  out.push(cur)
  return out.map((s) => s.trim())
}

function toDecimal(value) {
  if (value === undefined || value === null) return null
  const s = String(value).trim()
  if (!s) return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

function parseCsv(content) {
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0)
  if (lines.length === 0) {
    throw new Error('CSV is empty')
  }

  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase())
  for (const col of EXPECTED_HEADERS) {
    if (!header.includes(col)) {
      throw new Error(`Missing column "${col}". Expected: ${EXPECTED_HEADERS.join(', ')}`)
    }
  }

  const idx = Object.fromEntries(header.map((h, i) => [h, i]))
  const rows = []

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i])
    const name = (cols[idx.name] ?? '').trim()
    if (!name) continue

    rows.push({
      name,
      category: (cols[idx.category] ?? '').trim() || null,
      kcal_per_100g: toDecimal(cols[idx.kcal_per_100g]),
      carbs_g_per_100g: toDecimal(cols[idx.carbs_g_per_100g]),
      protein_g_per_100g: toDecimal(cols[idx.protein_g_per_100g]),
      fat_g_per_100g: toDecimal(cols[idx.fat_g_per_100g]),
      fiber_g_per_100g: toDecimal(cols[idx.fiber_g_per_100g]),
      source: 'ifct',
      is_verified: true,
      created_by: null,
    })
  }

  return rows
}

function chunk(arr, size) {
  const out = []
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size))
  }
  return out
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help) {
    console.log(`Usage: node scripts/seed-foods.js [--file path] [--dry-run]`)
    process.exit(0)
  }

  loadEnvFiles()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    console.error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n' +
        'Set them in .env.local or your shell before running this script.',
    )
    process.exit(1)
  }

  if (!fs.existsSync(args.file)) {
    console.error(`CSV not found: ${args.file}`)
    console.error('Create data/ifct-foods.csv with the expected header row, then re-run.')
    process.exit(1)
  }

  const raw = fs.readFileSync(args.file, 'utf8')
  const rows = parseCsv(raw)
  console.log(`Parsed ${rows.length} food rows from ${args.file}`)

  if (rows.length === 0) {
    console.log('Nothing to insert.')
    process.exit(0)
  }

  if (args.dryRun) {
    console.log('Dry run — first row sample:')
    console.log(JSON.stringify(rows[0], null, 2))
    console.log(`Would insert ${rows.length} rows in ${chunk(rows, BATCH_SIZE).length} batch(es).`)
    process.exit(0)
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const batches = chunk(rows, BATCH_SIZE)
  let inserted = 0

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i]
    const { error } = await supabase.from('foods').insert(batch)
    if (error) {
      console.error(`Batch ${i + 1}/${batches.length} failed after ${inserted} rows:`)
      console.error(error.message)
      process.exit(1)
    }
    inserted += batch.length
    console.log(`Inserted batch ${i + 1}/${batches.length} (${inserted}/${rows.length})`)
  }

  console.log(`Done. Inserted ${inserted} IFCT foods (source=ifct, is_verified=true).`)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
