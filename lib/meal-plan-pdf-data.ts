import { supabaseAdmin } from '@/lib/supabase-admin'
import { buildHraFormDefaults } from '@/lib/nutritionist-hra-defaults'
import type { PortalClientBundle } from '@/lib/nutritionist-types'
import {
  entryCellKey,
  normalizeMealPlanEntry,
  sumDayTotals,
  type MealPlanEntryDbRow,
  type MealPlanEntryRow,
} from '@/lib/meal-plan-entry-types'
import { datesForPlanDays, estimateDailyMacros, formatHeight, parseMealPlanMeta } from '@/lib/meal-plan-meta'
import { estimateDayTotalsFromMeals } from '@/lib/meal-slot-suggestions'
import type { MealPlan, MealPlanDay } from '@/lib/meal-plan-types'
import { MEAL_SLOT_META } from '@/lib/meal-plan-types'
import type { ClientRow, ProgressLogRow } from '@/lib/booking-types'
import {
  formatFoodQuantityForPdf,
  stripTrailingQuantityFromFoodName,
} from '@/lib/food-db-types'
import {
  DEFAULT_MEAL_PLAN_INSTRUCTIONS,
  PDF_MEAL_SLOT_LABELS,
  type MealPlanPdfDay,
  type MealPlanPdfDayMacros,
  type MealPlanPdfPayload,
} from '@/lib/meal-plan-pdf-types'

const ENTRY_SELECT =
  'id, meal_plan_id, entry_date, meal_slot, food_id, recipe_id, qty_grams, kcal, carbs_g, protein_g, fat_g, created_at, updated_at, foods(name, category, default_unit, default_qty_grams)'

function estimateFiber(kcal: number, targetKcal: number, targetFiber: number): number {
  if (kcal <= 0 || targetKcal <= 0) return 0
  return Math.round((kcal / targetKcal) * targetFiber)
}

function macrosFromTotals(
  totals: { kcal: number; carbs: number; protein: number; fat: number },
  targetKcal: number,
  targetFiber: number,
): MealPlanPdfDayMacros {
  return {
    kcal: Math.round(totals.kcal),
    protein: Math.round(totals.protein),
    fat: Math.round(totals.fat),
    carbs: Math.round(totals.carbs),
    fiber: estimateFiber(totals.kcal, targetKcal, targetFiber),
  }
}

function calcBmi(weightKg: number | null, heightCm: number | null): number | null {
  if (!weightKg || !heightCm || heightCm <= 0) return null
  const m = heightCm / 100
  return Math.round((weightKg / (m * m)) * 100) / 100
}

function calcBmr(weightKg: number | null, heightCm: number | null, age: number | null, gender: string): number | null {
  if (!weightKg || !heightCm || !age || age <= 0) return null
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age
  const g = gender.toLowerCase()
  if (g.startsWith('f')) return Math.round(base - 161)
  if (g.startsWith('m')) return Math.round(base + 5)
  return Math.round(base - 78)
}

function formatPdfDate(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function weekdayLabel(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-IN', { weekday: 'long' })
}

function entryDateForDay(day: MealPlanDay, columnDate: Date): string {
  if (day.plan_date) return day.plan_date
  return columnDate.toISOString().slice(0, 10)
}

function formatEntryLine(entry: MealPlanEntryRow): string {
  const rawName = entry.foods?.name?.trim() || 'Food item'
  const name = stripTrailingQuantityFromFoodName(rawName)
  const qty = entry.qty_grams
  if (qty > 0) {
    const qtyLabel = formatFoodQuantityForPdf({
      qtyGrams: qty,
      defaultUnit: entry.foods?.default_unit,
      defaultServingGrams: entry.foods?.default_qty_grams,
      foodName: rawName,
      category: entry.foods?.category,
    })
    return qtyLabel ? `${name} (${qtyLabel})` : name
  }
  return name
}

function mealLinesFromText(raw: string): string[] {
  return raw
    .split(/\n+/)
    .flatMap((line) => line.split(/,\s*(?=[A-Za-z])/))
    .map((s) => s.trim())
    .filter(Boolean)
}

function buildMealRows(
  day: MealPlanDay,
  entryDate: string,
  entriesByCell: Map<string, MealPlanEntryRow[]>,
): MealPlanPdfDay['meals'] {
  const rows: MealPlanPdfDay['meals'] = []

  for (const slot of MEAL_SLOT_META) {
    const cellEntries = entriesByCell.get(entryCellKey(entryDate, slot.key)) ?? []
    const text = day.meals[slot.key]?.trim() ?? ''

    if (cellEntries.length === 0 && !text) continue

    let description = ''
    if (cellEntries.length > 0) {
      description = cellEntries.map(formatEntryLine).join('\n')
    } else {
      description = mealLinesFromText(text).join('\n')
    }

    rows.push({
      slotLabel: PDF_MEAL_SLOT_LABELS[slot.key],
      description,
    })
  }

  return rows
}

async function fetchClientContext(clientId: string, clientEmail: string) {
  const { data: client } = await supabaseAdmin.from('clients').select('*').eq('id', clientId).maybeSingle()
  if (!client) return null

  const email = clientEmail.toLowerCase()
  const clerkUid = String(client.clerk_user_id || '')

  const { data: logsByEmail } = await supabaseAdmin
    .from('progress_logs')
    .select('*')
    .eq('client_email', email)
    .order('logged_at', { ascending: false })
    .limit(50)

  let progressLogs = (logsByEmail || []) as ProgressLogRow[]
  if (progressLogs.length === 0 && clerkUid) {
    const { data: logsByUser } = await supabaseAdmin
      .from('progress_logs')
      .select('*')
      .eq('user_id', clerkUid)
      .order('logged_at', { ascending: false })
      .limit(50)
    progressLogs = (logsByUser || []) as ProgressLogRow[]
  }

  let detailedAssessment: {
    diet_type?: string | null
    exercise_level?: string | null
  } | null = null
  if (clerkUid) {
    const { data } = await supabaseAdmin
      .from('detailed_assessments')
      .select('diet_type, exercise_level')
      .eq('user_id', clerkUid)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    detailedAssessment = data
  }
  if (!detailedAssessment) {
    const { data } = await supabaseAdmin
      .from('detailed_assessments')
      .select('diet_type, exercise_level')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    detailedAssessment = data
  }

  const bundle: PortalClientBundle = {
    client: client as ClientRow,
    appointments: [],
    notes: [],
    documents: [],
    dietPlans: [],
    paidReports: [],
    latestReadyReport: null,
    detailedAssessment: detailedAssessment as PortalClientBundle['detailedAssessment'],
    progressLogs,
    visibleNotesCount: 0,
  }

  return { client: client as ClientRow, hra: buildHraFormDefaults(bundle) }
}

export async function loadMealPlanPdfPayload(planId: string): Promise<MealPlanPdfPayload | null> {
  const { data: planRow, error } = await supabaseAdmin.from('meal_plans').select('*').eq('id', planId).maybeSingle()
  if (error || !planRow) return null

  const plan = planRow as MealPlan & { pdf_storage_path?: string | null }
  const meta = parseMealPlanMeta(plan.nutritionist_notes)
  const targetCalories = meta.targetCalories ?? plan.target_kcal ?? 1800
  const targetMacro = estimateDailyMacros(targetCalories)

  const { data: nut } = await supabaseAdmin
    .from('nutritionists')
    .select('name')
    .eq('id', plan.nutritionist_id)
    .maybeSingle()

  const ctx = await fetchClientContext(plan.client_id, plan.client_email)
  const hra = ctx?.hra
  const clientName = ctx?.client.name?.trim() || 'Client'
  const weightKg = hra?.actual_weight_kg ?? null
  const heightCm = hra?.height_cm ?? ctx?.client.height_cm ?? null
  const bmi = calcBmi(weightKg, heightCm)
  const gender = hra?.gender || '—'
  const age = hra?.age ?? null

  const { data: entryRows } = await supabaseAdmin
    .from('meal_plan_entries')
    .select(ENTRY_SELECT)
    .eq('meal_plan_id', planId)
    .order('entry_date', { ascending: true })

  const entries = (entryRows ?? []).map((row) => normalizeMealPlanEntry(row as MealPlanEntryDbRow))
  const entriesByCell = new Map<string, MealPlanEntryRow[]>()
  for (const entry of entries) {
    const key = entryCellKey(entry.entry_date, entry.meal_slot)
    const list = entriesByCell.get(key) ?? []
    list.push(entry)
    entriesByCell.set(key, list)
  }

  const days = (plan.days ?? []) as MealPlanDay[]
  const planDates = datesForPlanDays(days, new Date())
  const pdfDays: MealPlanPdfDay[] = []

  days.forEach((day, index) => {
    const columnDate = planDates[index] ?? new Date()
    const entryDate = entryDateForDay(day, columnDate)
    const skipped = !!day.skipped

    let macros: MealPlanPdfDayMacros
    const dayEntries = entries.filter((e) => e.entry_date === entryDate)
    if (dayEntries.length > 0) {
      macros = macrosFromTotals(sumDayTotals(dayEntries), targetCalories, targetMacro.fiber)
    } else if (!skipped) {
      macros = macrosFromTotals(
        estimateDayTotalsFromMeals(day.meals, index),
        targetCalories,
        targetMacro.fiber,
      )
    } else {
      macros = { kcal: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 }
    }

    pdfDays.push({
      dayNumber: day.day,
      weekdayLabel: weekdayLabel(entryDate),
      planDate: entryDate,
      macros,
      meals: skipped ? [] : buildMealRows(day, entryDate, entriesByCell),
      skipped,
    })
  })

  const noteText = meta.note?.trim() ?? ''
  const instructions = noteText
    ? [...DEFAULT_MEAL_PLAN_INSTRUCTIONS.slice(0, 7), noteText, ...DEFAULT_MEAL_PLAN_INSTRUCTIONS.slice(7)]
    : [...DEFAULT_MEAL_PLAN_INSTRUCTIONS]

  return {
    planId: plan.id,
    title: plan.title?.trim() || 'Personalised Diet Plan',
    client: {
      name: clientName,
      gender,
      age,
      weightKg,
      heightCm,
      heightLabel: formatHeight(heightCm),
      bmi,
      bmr: calcBmr(weightKg, heightCm, age, gender),
      regionalPreference: hra?.community || '—',
      foodChoice: hra?.food_preference || '—',
      lifestyle: hra?.activity_level || '—',
    },
    nutritionistName: nut?.name?.trim() || 'Your nutritionist',
    generatedDate: formatPdfDate(new Date().toISOString().slice(0, 10)),
    targetCalories,
    targetMacros: {
      kcal: targetCalories,
      protein: targetMacro.protein,
      fat: targetMacro.fat,
      carbs: targetMacro.carbs,
      fiber: targetMacro.fiber,
    },
    days: pdfDays.filter((d) => !d.skipped),
    instructions,
    notes: noteText,
  }
}
