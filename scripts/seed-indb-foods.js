#!/usr/bin/env node
/**
 * Upsert Indian Nutrient Database (INDB) prepared dishes into public.foods.
 *
 * Sources (merged, deduped by normalized name — Anuvaad wins over processed CSV):
 *   - data/anuvaad-indb-2024.csv   (from Anuvaad INDB xlsx via convert-anuvaad-xlsx-to-csv.py)
 *   - data/indian-food-nutrition-processed.csv
 *
 * Does NOT delete existing prepared meals — safe to run after seed-prepared-meals.js.
 *
 * Usage:
 *   npm run build:indb-csv     # if xlsx updated
 *   npm run seed:indb
 *   npm run seed:indb -- --dry-run
 */

const fs = require('node:fs')
const path = require('node:path')
const { createClient } = require('@supabase/supabase-js')

const BATCH_SIZE = 200
const ANUVAAD_CSV = path.join(process.cwd(), 'data', 'anuvaad-indb-2024.csv')
const PROCESSED_CSV = path.join(process.cwd(), 'data', 'indian-food-nutrition-processed.csv')

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

function normalizeName(name) {
  return name.toLowerCase().replace(/\s+/g, ' ').trim()
}

function parseHeaderCsv(content, rowMapper) {
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0)
  if (lines.length === 0) return []
  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase())
  const idx = Object.fromEntries(header.map((h, i) => [h, i]))
  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i])
    const mapped = rowMapper(cols, idx)
    if (mapped) rows.push(mapped)
  }
  return rows
}

function parseAnuvaadCsv(content) {
  return parseHeaderCsv(content, (cols, idx) => {
    const name = (cols[idx.name] ?? '').trim()
    if (!name) return null
    return {
      name,
      category: (cols[idx.category] ?? 'Prepared Meal').trim() || 'Prepared Meal',
      default_unit: (cols[idx.default_unit] ?? 'serving').trim() || 'serving',
      default_qty_grams: toDecimal(cols[idx.default_qty_grams]) ?? 150,
      kcal_per_100g: toDecimal(cols[idx.kcal_per_100g]),
      carbs_g_per_100g: toDecimal(cols[idx.carbs_g_per_100g]),
      protein_g_per_100g: toDecimal(cols[idx.protein_g_per_100g]),
      fat_g_per_100g: toDecimal(cols[idx.fat_g_per_100g]),
      fiber_g_per_100g: toDecimal(cols[idx.fiber_g_per_100g]),
      tags: ['prepared_meal', 'indb', 'anuvaad'],
      source: 'prepared',
      is_verified: true,
      created_by: null,
    }
  })
}

function parseProcessedCsv(content) {
  return parseHeaderCsv(content, (cols, idx) => {
    const name = (cols[idx['dish name']] ?? cols[idx.name] ?? '').trim()
    if (!name) return null
    return {
      name,
      category: 'Prepared Meal',
      default_unit: 'serving',
      default_qty_grams: 150,
      kcal_per_100g: toDecimal(cols[idx['calories (kcal)']] ?? cols[idx.kcal_per_100g]),
      carbs_g_per_100g: toDecimal(cols[idx['carbohydrates (g)']] ?? cols[idx.carbs_g_per_100g]),
      protein_g_per_100g: toDecimal(cols[idx['protein (g)']] ?? cols[idx.protein_g_per_100g]),
      fat_g_per_100g: toDecimal(cols[idx['fats (g)']] ?? cols[idx.fat_g_per_100g]),
      fiber_g_per_100g: toDecimal(cols[idx['fibre (g)']] ?? cols[idx.fiber_g_per_100g]),
      tags: ['prepared_meal', 'indb', 'processed_csv'],
      source: 'prepared',
      is_verified: true,
      created_by: null,
    }
  })
}

function mergeRows(anuvaadRows, processedRows) {
  const byName = new Map()
  for (const row of processedRows) {
    byName.set(normalizeName(row.name), row)
  }
  for (const row of anuvaadRows) {
    byName.set(normalizeName(row.name), row)
  }
  return [...byName.values()]
}

function chunk(arr, size) {
  const out = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

async function fetchExistingPreparedNames(supabase) {
  const names = new Set()
  let from = 0
  const pageSize = 1000
  while (true) {
    const { data, error } = await supabase
      .from('foods')
      .select('name')
      .eq('source', 'prepared')
      .range(from, from + pageSize - 1)
    if (error) throw error
    if (!data?.length) break
    for (const row of data) names.add(normalizeName(row.name))
    if (data.length < pageSize) break
    from += pageSize
  }
  return names
}

async function clearIndbRows(supabase) {
  const { error } = await supabase.from('foods').delete().contains('tags', ['indb'])
  if (error && !error.message.includes('contains')) {
    console.warn('[seed-indb] could not clear prior INDB rows:', error.message)
  }
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

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  loadEnvFiles()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const anuvaadRows = fs.existsSync(ANUVAAD_CSV)
    ? parseAnuvaadCsv(fs.readFileSync(ANUVAAD_CSV, 'utf8'))
    : []
  const processedRows = fs.existsSync(PROCESSED_CSV)
    ? parseProcessedCsv(fs.readFileSync(PROCESSED_CSV, 'utf8'))
    : []

  if (anuvaadRows.length === 0 && processedRows.length === 0) {
    console.error('No INDB CSV files found. Run: npm run build:indb-csv')
    process.exit(1)
  }

  const merged = mergeRows(anuvaadRows, processedRows)
  console.log(
    `Merged ${merged.length} INDB dishes (Anuvaad: ${anuvaadRows.length}, processed CSV: ${processedRows.length})`,
  )

  if (dryRun) {
    console.log('Dry run sample:', JSON.stringify(merged[0], null, 2))
    process.exit(0)
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const source = await detectPreparedSource(supabase)
  await clearIndbRows(supabase)

  const existingNames = await fetchExistingPreparedNames(supabase)
  const rows = merged
    .filter((r) => !existingNames.has(normalizeName(r.name)))
    .map((r) => ({ ...r, source }))

  if (rows.length === 0) {
    console.log('No new INDB rows to insert (all names already in foods table).')
    process.exit(0)
  }

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

  console.log(`Done. ${inserted} INDB prepared meals available in food search (source=${source}).`)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
