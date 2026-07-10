#!/usr/bin/env node
/**
 * Build data/ifct-foods.csv from official IFCT 2017 digitized data.
 *
 * Source: @ifct2017/compositions (National Institute of Nutrition, IFCT 2017)
 * https://github.com/ifct2017/compositions
 *
 * Usage:
 *   node scripts/build-ifct-csv.js
 *   npm run build:ifct-csv
 */

const fs = require('node:fs')
const path = require('node:path')
const https = require('node:https')

const RAW_URL = 'https://unpkg.com/@ifct2017/compositions@2.0.9/index.csv'
const RAW_PATH = path.join(process.cwd(), 'data', 'ifct2017-raw.csv')
const OUT_PATH = path.join(process.cwd(), 'data', 'ifct-foods.csv')

const KJ_TO_KCAL = 1 / 4.184

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

function csvEscape(value) {
  const s = value == null ? '' : String(value)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function toNum(raw) {
  if (raw == null) return ''
  const s = String(raw).trim()
  if (!s) return ''
  const n = Number(s)
  if (!Number.isFinite(n)) return ''
  return Math.round(n * 100) / 100
}

function kjToKcal(raw) {
  const s = String(raw ?? '').trim()
  if (!s) return ''
  const kj = Number(s)
  if (!Number.isFinite(kj)) return ''
  return Math.round(kj * KJ_TO_KCAL * 100) / 100
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest)
    https
      .get(url, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          file.close()
          fs.unlinkSync(dest)
          download(res.headers.location, dest).then(resolve).catch(reject)
          return
        }
        if (res.statusCode !== 200) {
          reject(new Error(`Download failed: HTTP ${res.statusCode}`))
          return
        }
        res.pipe(file)
        file.on('finish', () => file.close(resolve))
      })
      .on('error', reject)
  })
}

async function ensureRawCsv() {
  if (fs.existsSync(RAW_PATH) && fs.statSync(RAW_PATH).size > 100_000) {
    console.log(`Using cached ${RAW_PATH}`)
    return
  }
  console.log(`Downloading IFCT 2017 from ${RAW_URL} …`)
  fs.mkdirSync(path.dirname(RAW_PATH), { recursive: true })
  await download(RAW_URL, RAW_PATH)
  console.log(`Saved ${RAW_PATH}`)
}

function headerKey(headerCell) {
  const parts = headerCell.split(';')
  return (parts[parts.length - 1] ?? headerCell).trim().toLowerCase()
}

async function main() {
  await ensureRawCsv()

  const text = fs.readFileSync(RAW_PATH, 'utf8')
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
  if (lines.length < 2) throw new Error('Raw IFCT CSV is empty or invalid')

  const headers = parseCsvLine(lines[0])
  const col = {}
  headers.forEach((h, i) => {
    col[headerKey(h)] = i
  })

  for (const required of ['name', 'grup', 'enerc', 'choavldf', 'protcnt', 'fatce', 'fibtg']) {
    if (col[required] == null) {
      throw new Error(`Missing IFCT column "${required}" in raw CSV header`)
    }
  }

  const outLines = [
    'name,category,kcal_per_100g,carbs_g_per_100g,protein_g_per_100g,fat_g_per_100g,fiber_g_per_100g',
  ]

  let skipped = 0
  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i])
    const name = (row[col.name] ?? '').trim()
    if (!name) {
      skipped++
      continue
    }

    const line = [
      csvEscape(name),
      csvEscape((row[col.grup] ?? '').trim()),
      kjToKcal(row[col.enerc]),
      toNum(row[col.choavldf]),
      toNum(row[col.protcnt]),
      toNum(row[col.fatce]),
      toNum(row[col.fibtg]),
    ].join(',')

    outLines.push(line)
  }

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true })
  fs.writeFileSync(OUT_PATH, `${outLines.join('\n')}\n`, 'utf8')

  console.log(`Wrote ${outLines.length - 1} foods → ${OUT_PATH}`)
  if (skipped) console.log(`Skipped ${skipped} rows without a name`)
  console.log('')
  console.log('Next: npm run seed:foods')
  console.log('(Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local)')
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
