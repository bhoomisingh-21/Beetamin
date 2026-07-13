#!/usr/bin/env node
/**
 * Seed prepared Indian meals (Vegetable Poha, Methi Paratha, etc.) into public.foods.
 *
 * Uses source=prepared when migration 20260710140000 is applied; otherwise falls back
 * to source=ifct + tags=['prepared_meal'] so search works immediately.
 *
 * Usage:
 *   node scripts/seed-prepared-meals.js
 *   node scripts/seed-prepared-meals.js --dry-run
 */

const fs = require('node:fs')
const path = require('node:path')
const { createClient } = require('@supabase/supabase-js')

const BATCH_SIZE = 100
const DEFAULT_CSV = path.join(process.cwd(), 'data', 'prepared-meals.csv')

const BASE_HEADERS = [
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
        } else inQuotes = false
      } else cur += ch
    } else if (ch === '"') inQuotes = true
    else if (ch === ',') {
      out.push(cur)
      cur = ''
    } else cur += ch
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
  if (lines.length === 0) throw new Error('CSV is empty')

  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase())
  for (const col of BASE_HEADERS) {
    if (!header.includes(col)) {
      throw new Error(`Missing column "${col}"`)
    }
  }

  const idx = Object.fromEntries(header.map((h, i) => [h, i]))
  const hasDefaultQty = header.includes('default_qty_grams')
  const rows = []

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i])
    const name = (cols[idx.name] ?? '').trim()
    if (!name) continue

    const defaultQty = hasDefaultQty ? toDecimal(cols[idx.default_qty_grams]) : 150

    rows.push({
      name,
      category: (cols[idx.category] ?? '').trim() || 'Prepared Meal',
      default_unit: 'serving',
      default_qty_grams: defaultQty ?? 150,
      kcal_per_100g: toDecimal(cols[idx.kcal_per_100g]),
      carbs_g_per_100g: toDecimal(cols[idx.carbs_g_per_100g]),
      protein_g_per_100g: toDecimal(cols[idx.protein_g_per_100g]),
      fat_g_per_100g: toDecimal(cols[idx.fat_g_per_100g]),
      fiber_g_per_100g: toDecimal(cols[idx.fiber_g_per_100g]),
      tags: ['prepared_meal'],
      is_verified: true,
      created_by: null,
    })
  }

  return rows
}

function chunk(arr, size) {
  const out = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

async function detectPreparedSource(supabase) {
  const probe = {
    name: '__prepared_source_probe__',
    category: 'Probe',
    source: 'prepared',
    is_verified: false,
    created_by: null,
  }
  const { error } = await supabase.from('foods').insert(probe)
  if (!error) {
    await supabase.from('foods').delete().eq('name', probe.name)
    return 'prepared'
  }
  return 'ifct'
}

async function clearExisting(supabase, source) {
  if (source === 'prepared') {
    await supabase.from('foods').delete().eq('source', 'prepared')
    return
  }
  await supabase.from('foods').delete().eq('source', 'ifct').contains('tags', ['prepared_meal'])
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  loadEnvFiles()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  if (!fs.existsSync(DEFAULT_CSV)) {
    console.error(`CSV not found: ${DEFAULT_CSV}`)
    process.exit(1)
  }

  const baseRows = parseCsv(fs.readFileSync(DEFAULT_CSV, 'utf8'))
  console.log(`Parsed ${baseRows.length} prepared meals from ${DEFAULT_CSV}`)

  if (dryRun) {
    console.log(JSON.stringify(baseRows[0], null, 2))
    process.exit(0)
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const source = await detectPreparedSource(supabase)
  if (source === 'ifct') {
    console.log('Note: migration 20260710140000 not applied — seeding as IFCT tagged prepared_meal.')
  }

  await clearExisting(supabase, source)

  const rows = baseRows.map((r) => ({ ...r, source }))
  let inserted = 0

  for (const batch of chunk(rows, BATCH_SIZE)) {
    const { error } = await supabase.from('foods').insert(batch)
    if (error) {
      console.error('Insert failed:', error.message)
      process.exit(1)
    }
    inserted += batch.length
    console.log(`Inserted ${inserted}/${rows.length}`)
  }

  console.log(
    `Done. ${inserted} prepared Indian meals (source=${source}). Try search: "Poha", "Methi Paratha", "Dosa".`,
  )
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
