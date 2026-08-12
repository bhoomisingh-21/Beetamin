import React from 'react'
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { sanitizeForPdf } from '@/lib/generate-pdf'
import type { MealPlanPdfPayload } from '@/lib/meal-plan-pdf-types'

const C = {
  emerald: '#10B981',
  emeraldDark: '#064E3B',
  dark: '#0A0F0A',
  text: '#111827',
  muted: '#6B7280',
  border: '#D1D5DB',
  rowBg: '#F9FAFB',
  white: '#FFFFFF',
}

const styles = StyleSheet.create({
  page: { padding: 36, fontFamily: 'Helvetica', fontSize: 12, color: C.text, lineHeight: 1.45 },
  brandBar: { height: 4, backgroundColor: C.emerald, marginBottom: 18 },
  brand: { fontSize: 13, fontWeight: 700, color: C.emeraldDark, letterSpacing: 1.2, marginBottom: 4 },
  title: { fontSize: 22, fontWeight: 700, color: C.dark, marginBottom: 4 },
  subtitle: { fontSize: 13, color: C.muted, marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: 700, color: C.emeraldDark, marginBottom: 8, marginTop: 4 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  summaryCard: {
    width: '48%',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 6,
    padding: 10,
    backgroundColor: C.rowBg,
  },
  summaryLabel: { fontSize: 10, color: C.muted, textTransform: 'uppercase', marginBottom: 2 },
  summaryValue: { fontSize: 13, fontWeight: 700, color: C.text },
  macroRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  macroChip: {
    flexGrow: 1,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 6,
    paddingVertical: 7,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  macroChipLabel: { fontSize: 10, color: C.muted },
  macroChipValue: { fontSize: 12, fontWeight: 700, marginTop: 2 },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderBottomWidth: 2,
    borderBottomColor: C.emerald,
    paddingBottom: 6,
    marginBottom: 10,
  },
  dayTitle: { fontSize: 16, fontWeight: 700, color: C.dark },
  dayKcal: { fontSize: 13, fontWeight: 700, color: C.emeraldDark },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: C.emeraldDark,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  tableHeaderCell: { color: C.white, fontSize: 11, fontWeight: 700 },
  mealCol: { width: '32%' },
  descCol: { width: '68%' },
  mealRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: C.border,
    paddingVertical: 8,
    paddingHorizontal: 8,
    minHeight: 32,
  },
  mealRowAlt: { backgroundColor: C.rowBg },
  mealLabel: { width: '32%', fontSize: 11, fontWeight: 700, color: C.emeraldDark, paddingRight: 6 },
  mealDesc: { width: '68%', fontSize: 11, color: C.text },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 36,
    right: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 8,
  },
  footerText: { fontSize: 9, color: C.muted },
  instructionItem: { fontSize: 11, color: C.text, marginBottom: 7, paddingLeft: 8 },
})

function MacroChips({ macros }: { macros: MealPlanPdfPayload['targetMacros'] }) {
  const items = [
    { label: 'Protein', value: `${macros.protein} gm` },
    { label: 'Fat', value: `${macros.fat} gm` },
    { label: 'Carbs', value: `${macros.carbs} gm` },
    { label: 'Fiber', value: `${macros.fiber} gm` },
  ]
  return (
    <View style={styles.macroRow}>
      {items.map((item) => (
        <View key={item.label} style={styles.macroChip}>
          <Text style={styles.macroChipLabel}>{item.label}</Text>
          <Text style={styles.macroChipValue}>{item.value}</Text>
        </View>
      ))}
    </View>
  )
}

function SummaryPage({ data }: { data: MealPlanPdfPayload }) {
  const c = data.client
  const profileLine = [
    c.gender !== '—' ? c.gender : null,
    c.age ? `${c.age} years` : null,
    c.bmr ? `${c.bmr} BMR` : null,
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.brandBar} />
      <Text style={styles.brand}>THE BEETAMIN</Text>
      <Text style={styles.title}>Dear {sanitizeForPdf(c.name)},</Text>
      <Text style={styles.subtitle}>
        Here is a suggested plan for you · Date: {data.generatedDate}
      </Text>

      <Text style={styles.sectionTitle}>Diet Plan Summary</Text>
      <Text style={{ fontSize: 12, marginBottom: 10 }}>
        {sanitizeForPdf(c.name)}
        {profileLine ? ` · ${profileLine}` : ''}
      </Text>

      <View style={styles.summaryGrid}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Weight</Text>
          <Text style={styles.summaryValue}>{c.weightKg != null ? `${c.weightKg.toFixed(1)} kg` : '—'}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Height</Text>
          <Text style={styles.summaryValue}>{c.heightLabel}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>BMI</Text>
          <Text style={styles.summaryValue}>{c.bmi != null ? String(c.bmi) : '—'}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Plan</Text>
          <Text style={styles.summaryValue}>{sanitizeForPdf(data.title)}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Suggested Plan for You</Text>
      <Text style={{ fontSize: 12, marginBottom: 6 }}>
        Nutrition macros requirement · {data.targetCalories} Kcal
      </Text>
      <MacroChips macros={data.targetMacros} />

      <View style={styles.summaryGrid}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Regional diet preference</Text>
          <Text style={styles.summaryValue}>{sanitizeForPdf(c.regionalPreference)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Food choice</Text>
          <Text style={styles.summaryValue}>{sanitizeForPdf(c.foodChoice)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Lifestyle</Text>
          <Text style={styles.summaryValue}>{sanitizeForPdf(c.lifestyle)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Nutritionist</Text>
          <Text style={styles.summaryValue}>{sanitizeForPdf(data.nutritionistName)}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>thebeetamin.com · Personalised nutrition</Text>
        <Text style={styles.footerText}>Page 1 of {data.days.length + 2}</Text>
      </View>
    </Page>
  )
}

function DayPage({
  data,
  day,
  pageNumber,
  totalPages,
}: {
  data: MealPlanPdfPayload
  day: MealPlanPdfPayload['days'][number]
  pageNumber: number
  totalPages: number
}) {
  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.brandBar} />
      <View style={styles.dayHeader}>
        <Text style={styles.dayTitle}>
          Diet Plan · Day: {day.weekdayLabel}
        </Text>
        <Text style={styles.dayKcal}>{day.macros.kcal} Kcal Plan</Text>
      </View>

      <MacroChips macros={day.macros} />

      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderCell, styles.mealCol]}>Meal</Text>
        <Text style={[styles.tableHeaderCell, styles.descCol]}>Description</Text>
      </View>

      {day.meals.length === 0 ? (
        <View style={styles.mealRow}>
          <Text style={styles.mealDesc}>No meals added for this day.</Text>
        </View>
      ) : (
        day.meals.map((meal, idx) => (
          <View key={`${meal.slotLabel}-${idx}`} style={[styles.mealRow, idx % 2 === 1 ? styles.mealRowAlt : {}]}>
            <Text style={styles.mealLabel}>{sanitizeForPdf(meal.slotLabel)}</Text>
            <Text style={styles.mealDesc}>{sanitizeForPdf(meal.description)}</Text>
          </View>
        ))
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>{sanitizeForPdf(data.client.name)} · {sanitizeForPdf(data.title)}</Text>
        <Text style={styles.footerText}>
          Page {pageNumber} of {totalPages}
        </Text>
      </View>
    </Page>
  )
}

function InstructionsPage({
  data,
  pageNumber,
  totalPages,
}: {
  data: MealPlanPdfPayload
  pageNumber: number
  totalPages: number
}) {
  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.brandBar} />
      <Text style={styles.sectionTitle}>Instructions</Text>
      {data.instructions.map((line, idx) => (
        <Text key={idx} style={styles.instructionItem}>
          {idx + 1}. {sanitizeForPdf(line)}
        </Text>
      ))}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Prepared by {sanitizeForPdf(data.nutritionistName)}</Text>
        <Text style={styles.footerText}>
          Page {pageNumber} of {totalPages}
        </Text>
      </View>
    </Page>
  )
}

export function MealPlanDocument({ data }: { data: MealPlanPdfPayload }) {
  const totalPages = data.days.length + 2
  return (
    <Document title={data.title} author="The Beetamin">
      <SummaryPage data={data} />
      {data.days.map((day, idx) => (
        <DayPage key={day.planDate} data={data} day={day} pageNumber={idx + 2} totalPages={totalPages} />
      ))}
      <InstructionsPage data={data} pageNumber={totalPages} totalPages={totalPages} />
    </Document>
  )
}

export function MealPlanPDF({ data }: { data: MealPlanPdfPayload }) {
  return <MealPlanDocument data={data} />
}
