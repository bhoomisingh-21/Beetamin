/**
 * One-time seed: author ~150-200 everyday clinical nutrition meals into public.meals via Groq,
 * validated against the schema, then inserted with the Supabase service role key.
 *
 * The `meals` table + RLS must already exist — run supabase/migrations/20260802120000_create_meals_table.sql
 * (or the root SUPABASE_MEALS_SETUP.sql mirror) in the Supabase SQL Editor first.
 *
 * Required env (from .env.local or shell):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   GROQ_API_KEY
 *
 * Usage:
 *   npx tsx scripts/seed-meal-database.ts
 *   npx tsx scripts/seed-meal-database.ts --dry-run
 *   npm run seed:meals
 */

import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import Groq from 'groq-sdk'
import { GROQ_PRIMARY_MODEL } from '../lib/groq-models'
import { textContainsExcludedFood, textContainsRegionalSpecialty } from '../lib/meal-engine/rules'

const MEAL_TYPES = ['breakfast', 'mid_morning_snack', 'lunch', 'evening_snack', 'dinner'] as const
/** Internal DB metadata only — not shown to users; meals must NOT be cuisine-branded in names. */
const CUISINES = [
  'north_indian',
  'south_indian',
  'gujarati',
  'maharashtrian',
  'punjabi',
  'bengali',
  'rajasthani',
  'indian_fusion',
] as const
/** Clinical nutrition focus areas used to batch-generate everyday therapeutic meals. */
const HEALTH_FOCUS_AREAS = [
  'iron_recovery',
  'pcos_metabolic',
  'high_fiber_gut',
  'high_protein_lean',
  'low_gi_diabetes',
  'calcium_bone',
  'vitamin_d_support',
  'balanced_clinical',
] as const
const DIET_TYPES = ['vegetarian', 'vegan', 'jain', 'non_vegetarian'] as const
const HEALTH_TAGS = [
  'high_protein',
  'weight_loss',
  'muscle_gain',
  'pcos',
  'diabetes',
  'thyroid',
  'iron_rich',
  'calcium_rich',
  'vitamin_d',
  'vitamin_b12',
  'high_fiber',
  'low_carb',
  'low_gi',
  'heart_healthy',
  'gut_friendly',
] as const
const DIFFICULTIES = ['easy', 'medium', 'hard'] as const
const KNOWN_ALLERGENS = ['nuts', 'dairy', 'gluten', 'soy', 'eggs', 'seafood']

type MealType = (typeof MEAL_TYPES)[number]
type Cuisine = (typeof CUISINES)[number]
type HealthFocus = (typeof HEALTH_FOCUS_AREAS)[number]

/** kcal sanity band per meal type — anything outside this is rejected. */
const CALORIE_RANGE: Record<MealType, [number, number]> = {
  breakfast: [150, 450],
  mid_morning_snack: [80, 250],
  lunch: [350, 700],
  evening_snack: [80, 250],
  dinner: [350, 700],
}

type RawMeal = {
  meal_name?: unknown
  meal_type?: unknown
  cuisine?: unknown
  diet_type?: unknown
  health_tags?: unknown
  calories?: unknown
  protein_g?: unknown
  carbs_g?: unknown
  fat_g?: unknown
  fiber_g?: unknown
  serving_size?: unknown
  ingredients?: unknown
  allergens?: unknown
  difficulty?: unknown
  preparation_time_minutes?: unknown
  preparation_notes?: unknown
  hydration_tip?: unknown
  healthy_alternative?: unknown
}

type MealInsertRow = {
  meal_name: string
  meal_type: MealType
  cuisine: Cuisine
  diet_type: string[]
  health_tags: string[]
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
  serving_size: string
  ingredients: string[]
  allergens: string[]
  difficulty: string
  preparation_time_minutes: number
  preparation_notes: string | null
  hydration_tip: string | null
  healthy_alternative: string | null
}

// ─── env / CLI ──────────────────────────────────────────────────────────────

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
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }
      if (process.env[key] === undefined) process.env[key] = value
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ─── batch plan: 5 meal types x 8 health-focus areas, grouped ~3 combos / call ───────

type ComboCount = { mealType: MealType; healthFocus: HealthFocus; count: number }

function buildComboMatrix(): ComboCount[] {
  const combos: ComboCount[] = []
  for (const mealType of MEAL_TYPES) {
    for (const healthFocus of HEALTH_FOCUS_AREAS) {
      combos.push({ mealType, healthFocus, count: 5 })
    }
  }
  return combos
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

// ─── Groq call ──────────────────────────────────────────────────────────────

function getGroq(): Groq {
  const key = process.env.GROQ_API_KEY
  if (!key) throw new Error('GROQ_API_KEY is not configured')
  return new Groq({ apiKey: key })
}

const SYSTEM_PROMPT = `You are a senior Indian clinical nutritionist authoring a tagged meal database for a personalized nutrition SaaS.
Author EVERYDAY CLINICAL NUTRITION meals — therapeutic, home-kitchen dishes that a dietitian would prescribe for deficiencies, PCOS, diabetes, and gut health.

CRITICAL — meal_name format (this is what patients see on their diet plan):
- Lead with the health purpose, NOT the regional dish name.
- Good: "Iron-Rich Spinach Moong Dal with Brown Rice", "Low-GI Ragi Vegetable Upma", "PCOS-Friendly Moong Sprout Salad", "High-Fiber Oats Moong Chilla with Curd"
- Bad: "Undhiyu", "Misal Pav", "Shukto", "Dhokla", "Bengali Thali", "Gujarati Thali", "Chettinad Chicken", "Pav Bhaji", "Biryani", "Puran Poli"
- NEVER use festival foods, street food, regional thali names, sweets, or "food tourism" dish names.
- NEVER brand meals by state/cuisine in the name (no "Bengali", "Gujarati", "Maharashtrian", "Punjabi" in meal_name).
- Use simple Indian home ingredients: dal, moong, ragi, oats, millets, sprouts, steamed/grilled vegetables, curd, buttermilk, brown rice, whole wheat roti.
- No western dishes (no quinoa bowls, avocado, kale, sandwiches, pasta, pizza, protein bars).

The "cuisine" field is internal metadata only — assign one of ${JSON.stringify(CUISINES)} based on ingredient style, but meal_name must NEVER read like a regional specialty.

CALORIE TARGETS (per serving) — every meal MUST land inside its meal_type's range:
- breakfast: 150-450 kcal
- mid_morning_snack: 80-250 kcal
- lunch: 350-700 kcal
- evening_snack: 80-250 kcal
- dinner: 350-700 kcal
For lunch and dinner, meal_name must describe a COMPLETE therapeutic plate (2-4 components) so total calories land in 350-700 kcal — e.g. "High-Protein Masoor Dal + Brown Rice + Steamed Lauki Sabzi + 2 Whole Wheat Roti". A single side dish alone is NEVER valid lunch/dinner.

TAG VALUES ARE CLOSED VOCABULARIES — use ONLY the exact strings listed for diet_type, health_tags, allergens, and difficulty below.

Output STRICT JSON only, matching this exact shape (no markdown, no comments, no extra keys):
{
  "meals": [
    {
      "meal_name": string,
      "meal_type": one of ${JSON.stringify(MEAL_TYPES)},
      "cuisine": one of ${JSON.stringify(CUISINES)},
      "diet_type": array of one or more of ${JSON.stringify(DIET_TYPES)},
      "health_tags": array of one or more of ${JSON.stringify(HEALTH_TAGS)},
      "calories": number,
      "protein_g": number,
      "carbs_g": number,
      "fat_g": number,
      "fiber_g": number,
      "serving_size": string,
      "ingredients": array of 3-8 short ingredient names,
      "allergens": array, subset of ${JSON.stringify(KNOWN_ALLERGENS)},
      "difficulty": one of ${JSON.stringify(DIFFICULTIES)},
      "preparation_time_minutes": integer 5-90,
      "preparation_notes": short 1-line prep tip or null,
      "hydration_tip": short 1-line hydration tip (never null),
      "healthy_alternative": short 1-line lighter swap, or null if already optimal
    }
  ]
}

Rules:
- jain diet_type: NO onion, garlic, or root vegetables — only tag jain if genuinely compliant.
- non_vegetarian only for egg/chicken/fish/meat dishes.
- health_tags must be honest — tag "pcos"/"low_gi" only for genuinely low-glycemic whole-food meals.
- Every meal_name in a single response must be unique.
- Match the assigned health_focus with appropriate health_tags and ingredients.`

function buildUserPrompt(combos: ComboCount[]): string {
  const lines = combos.map(
    (c) =>
      `- meal_type="${c.mealType}", health_focus="${c.healthFocus}": produce exactly ${c.count} distinct clinical nutrition meals`,
  )
  return `Generate everyday clinical nutrition meals for these assignments. Return ONLY the JSON object — the "meals" array must contain exactly ${combos.reduce((s, c) => s + c.count, 0)} objects, matching each assignment's meal_type exactly:\n${lines.join('\n')}`
}

async function requestMealBatch(groq: Groq, combos: ComboCount[]): Promise<RawMeal[]> {
  const completion = await groq.chat.completions.create({
    model: GROQ_PRIMARY_MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildUserPrompt(combos) },
    ],
    temperature: 0.6,
    max_tokens: 4096,
    response_format: { type: 'json_object' },
  })

  const content = completion.choices[0]?.message?.content
  if (!content) throw new Error('Empty response from Groq')

  const parsed = JSON.parse(content) as { meals?: unknown }
  if (!Array.isArray(parsed.meals)) throw new Error('Response JSON missing "meals" array')
  return parsed.meals as RawMeal[]
}

async function requestMealBatchWithRetry(groq: Groq, combos: ComboCount[], maxAttempts = 4): Promise<RawMeal[]> {
  let lastError: unknown
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await requestMealBatch(groq, combos)
    } catch (err) {
      lastError = err
      const message = err instanceof Error ? err.message : String(err)
      const status = (err as { status?: number } | undefined)?.status
      const isRateLimit = status === 429 || /rate_limit|tokens per minute/i.test(message)
      const waitMs = isRateLimit ? 15000 + attempt * 5000 : 2000 + attempt * 1000
      console.warn(`  Batch attempt ${attempt + 1}/${maxAttempts} failed: ${message}. Retrying in ${waitMs}ms...`)
      await sleep(waitMs)
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError))
}

// ─── validation ─────────────────────────────────────────────────────────────

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === 'string')
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v)
}

/** Validates + normalizes a raw Groq meal object against the schema. Returns null if invalid. */
function validateMeal(raw: RawMeal, seenNamesLower: Set<string>): MealInsertRow | null {
  if (!isNonEmptyString(raw.meal_name)) return null
  const nameLower = raw.meal_name.trim().toLowerCase()
  if (seenNamesLower.has(nameLower)) return null // dedupe within batch + against DB

  if (typeof raw.meal_type !== 'string' || !MEAL_TYPES.includes(raw.meal_type as MealType)) return null
  const mealType = raw.meal_type as MealType

  if (typeof raw.cuisine !== 'string' || !CUISINES.includes(raw.cuisine as Cuisine)) return null
  const cuisine = raw.cuisine as Cuisine

  if (!isStringArray(raw.diet_type) || raw.diet_type.length === 0) return null
  const dietType = raw.diet_type.filter((d) => (DIET_TYPES as readonly string[]).includes(d))
  if (dietType.length === 0) return null

  if (!isStringArray(raw.health_tags) || raw.health_tags.length === 0) return null
  const healthTags = raw.health_tags.filter((t) => (HEALTH_TAGS as readonly string[]).includes(t))
  if (healthTags.length === 0) return null

  if (!isFiniteNumber(raw.calories)) return null
  const [minCal, maxCal] = CALORIE_RANGE[mealType]
  if (raw.calories < minCal || raw.calories > maxCal) return null

  if (!isFiniteNumber(raw.protein_g) || raw.protein_g < 0 || raw.protein_g > 60) return null
  if (!isFiniteNumber(raw.carbs_g) || raw.carbs_g < 0 || raw.carbs_g > 120) return null
  if (!isFiniteNumber(raw.fat_g) || raw.fat_g < 0 || raw.fat_g > 60) return null
  if (!isFiniteNumber(raw.fiber_g) || raw.fiber_g < 0 || raw.fiber_g > 30) return null

  if (!isNonEmptyString(raw.serving_size)) return null

  if (!isStringArray(raw.ingredients) || raw.ingredients.length === 0) return null

  const allergens = isStringArray(raw.allergens) ? raw.allergens.filter((a) => KNOWN_ALLERGENS.includes(a)) : []

  if (typeof raw.difficulty !== 'string' || !DIFFICULTIES.includes(raw.difficulty as (typeof DIFFICULTIES)[number])) {
    return null
  }

  if (
    !isFiniteNumber(raw.preparation_time_minutes) ||
    raw.preparation_time_minutes < 5 ||
    raw.preparation_time_minutes > 180
  ) {
    return null
  }

  const ingredientList = isStringArray(raw.ingredients) ? raw.ingredients.map((i) => i.trim()).filter(Boolean) : []
  const mealText = [raw.meal_name.trim(), ...ingredientList].join(' ')
  const metabolicTags = ['pcos', 'diabetes', 'weight_loss', 'low_gi'] as const
  if (healthTags.some((t) => (metabolicTags as readonly string[]).includes(t)) && textContainsExcludedFood(mealText)) {
    return null
  }
  if (textContainsRegionalSpecialty(mealText)) return null
  if (/bengali|gujarati|maharashtrian|punjabi|rajasthani|chettinad|thali|street/i.test(raw.meal_name.trim())) {
    return null
  }

  return {
    meal_name: raw.meal_name.trim(),
    meal_type: mealType,
    cuisine,
    diet_type: dietType,
    health_tags: healthTags,
    calories: Math.round(raw.calories),
    protein_g: Math.round(raw.protein_g * 10) / 10,
    carbs_g: Math.round(raw.carbs_g * 10) / 10,
    fat_g: Math.round(raw.fat_g * 10) / 10,
    fiber_g: Math.round(raw.fiber_g * 10) / 10,
    serving_size: raw.serving_size.trim(),
    ingredients: ingredientList,
    allergens,
    difficulty: raw.difficulty,
    preparation_time_minutes: Math.round(raw.preparation_time_minutes),
    preparation_notes: isNonEmptyString(raw.preparation_notes) ? raw.preparation_notes.trim() : null,
    hydration_tip: isNonEmptyString(raw.hydration_tip) ? raw.hydration_tip.trim() : null,
    healthy_alternative: isNonEmptyString(raw.healthy_alternative) ? raw.healthy_alternative.trim() : null,
  }
}

// ─── main ───────────────────────────────────────────────────────────────────

const TARGET_MEAL_COUNT = 180
const BATCH_INSERT_SIZE = 50
const COMBOS_PER_CALL = 3
const DELAY_BETWEEN_CALLS_MS = 4500

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  loadEnvFiles()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const groqKey = process.env.GROQ_API_KEY

  const missing: string[] = []
  if (!supabaseUrl) missing.push('NEXT_PUBLIC_SUPABASE_URL')
  if (!serviceKey) missing.push('SUPABASE_SERVICE_ROLE_KEY')
  if (!groqKey) missing.push('GROQ_API_KEY')
  if (missing.length > 0) {
    console.error(`Missing required env var(s): ${missing.join(', ')}. Set them in .env.local and re-run.`)
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl!, serviceKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // Confirm the target table exists before spending Groq calls. (Avoid `head: true` here —
  // some PostgREST setups return a bodiless 204/no-error response for HEAD on a missing table.)
  const { error: tableCheckError } = await supabase.from('meals').select('id').limit(1)
  if (tableCheckError) {
    console.error(
      'Could not read public.meals — has the migration been applied yet?\n' +
        'Run supabase/migrations/20260802120000_create_meals_table.sql (or SUPABASE_MEALS_SETUP.sql) ' +
        'in the Supabase Dashboard → SQL Editor, then re-run this script.\n' +
        `Supabase error: ${tableCheckError.message}`,
    )
    process.exit(1)
  }

  const seenNamesLower = new Set<string>()
  {
    const { data: existing, error } = await supabase.from('meals').select('meal_name')
    if (error) {
      console.error(`Failed to read existing meals for dedupe: ${error.message}`)
      process.exit(1)
    }
    for (const row of existing ?? []) {
      if (isNonEmptyString((row as { meal_name?: unknown }).meal_name)) {
        seenNamesLower.add((row as { meal_name: string }).meal_name.trim().toLowerCase())
      }
    }
    console.log(`Found ${seenNamesLower.size} existing meal(s) in public.meals (used for dedupe).`)
  }

  const groq = getGroq()
  const comboBatches = chunk(buildComboMatrix(), COMBOS_PER_CALL)

  const validatedRows: MealInsertRow[] = []
  let batchNum = 0

  for (const combos of comboBatches) {
    batchNum += 1
    if (validatedRows.length >= TARGET_MEAL_COUNT) {
      console.log(`Reached target of ${TARGET_MEAL_COUNT}+ meals — stopping batch generation early.`)
      break
    }

    const comboDesc = combos.map((c) => `${c.mealType}/${c.healthFocus}`).join(', ')
    console.log(`\nBatch ${batchNum}/${comboBatches.length} — requesting meals for: ${comboDesc}`)

    let rawMeals: RawMeal[]
    try {
      rawMeals = await requestMealBatchWithRetry(groq, combos)
    } catch (err) {
      console.error(`  Batch ${batchNum} failed after retries: ${err instanceof Error ? err.message : err}`)
      await sleep(DELAY_BETWEEN_CALLS_MS)
      continue
    }

    let acceptedInBatch = 0
    for (const raw of rawMeals) {
      const validated = validateMeal(raw, seenNamesLower)
      if (!validated) continue
      seenNamesLower.add(validated.meal_name.toLowerCase())
      validatedRows.push(validated)
      acceptedInBatch += 1
    }
    console.log(`  Received ${rawMeals.length}, accepted ${acceptedInBatch} after validation + dedupe.`)

    await sleep(DELAY_BETWEEN_CALLS_MS)
  }

  console.log(`\nTotal validated meals ready to insert: ${validatedRows.length}`)

  if (validatedRows.length === 0) {
    console.log('Nothing to insert.')
    process.exit(0)
  }

  if (dryRun) {
    console.log('Dry run — sample row:')
    console.log(JSON.stringify(validatedRows[0], null, 2))
    console.log(`Would insert ${validatedRows.length} rows.`)
    process.exit(0)
  }

  let inserted = 0
  for (const batch of chunk(validatedRows, BATCH_INSERT_SIZE)) {
    const { error } = await supabase.from('meals').insert(batch)
    if (error) {
      console.error(`Insert failed after ${inserted} rows: ${error.message}`)
      process.exit(1)
    }
    inserted += batch.length
    console.log(`Inserted ${inserted}/${validatedRows.length}`)
  }

  console.log(`\nDone. Inserted ${inserted} clinical nutrition meals into public.meals.`)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.stack ?? err.message : err)
  process.exit(1)
})
