import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { RecoveryReportSections } from '@/lib/recovery-report-types'

const GREEN = '#1a472a'
const LIGHT_GREEN = '#d4edda'
const TEXT = '#1a1a1a'
const MUTED = '#666666'
const ROW_BG = '#f8f9fa'
const CREAM = '#faf8f2'
const RED = '#b91c1c'
const BULLET = '\u2022 '

/** Strip/replace emoji and pictographs so Helvetica renders reliably in react-pdf */
export function sanitizeForPdf(raw: string): string {
  let t = raw
  const pairs: [RegExp, string][] = [
    [/🌅\s*/g, 'BREAKFAST — '],
    [/🍎\s*/g, 'MID-MORNING — '],
    [/☀️\s*/g, 'LUNCH — '],
    [/🌿\s*/g, 'EVENING SNACK — '],
    [/🌙\s*/g, 'DINNER — '],
    [/⏰\s*/g, ''],
    [/❌\s*/g, '[AVOID] '],
    [/✅\s*/g, '[TRY INSTEAD] '],
    [/⚕️\s*/g, ''],
    [/🔬/g, ''],
    [/🥗/g, ''],
    [/💊/g, ''],
    [/🚫/g, ''],
    [/📅/g, ''],
    [/👩‍⚕️/g, ''],
    [/👩\u200d⚕️/g, ''],
    [/🔒/g, ''],
    [/📄/g, ''],
    [/📧/g, ''],
    [/🎉/g, ''],
  ]
  for (const [re, rep] of pairs) t = t.replace(re, rep)
  t = t.replace(/\uFE0F/g, '')
  try {
    t = t.replace(/\p{Extended_Pictographic}/gu, '')
  } catch {
    t = t.replace(/[\u231A-\u231B\u23E9-\u23EC\u23F0\u23F3\u25FD-\u25FE\u2614-\u2615\u2648-\u2653\u267F\u2693\u26A1\u26AA-\u26AB\u26BD-\u26BE\u26C4-\u26C5\u26CE\u26D4\u26EA\u26F2-\u26F3\u26F5\u26FA\u26FD\u2705\u270A-\u270B\u2728\u274C\u274E\u2753-\u2755\u2757\u2795-\u2797\u27B0\u27BF\u2B1B-\u2B1C\u2B50\u2B55]/g, '')
  }
  t = t.replace(/^\s*[-*]\s+/gm, BULLET)
  return t.replace(/\n{3,}/g, '\n\n').trim()
}

function sanitizeSections(s: RecoveryReportSections): RecoveryReportSections {
  return {
    deficiencyAnalysis: sanitizeForPdf(s.deficiencyAnalysis),
    mealPlan: sanitizeForPdf(s.mealPlan),
    supplements: sanitizeForPdf(s.supplements),
    blockingFoods: sanitizeForPdf(s.blockingFoods),
    dailyRoutine: sanitizeForPdf(s.dailyRoutine),
    doctorNote: sanitizeForPdf(s.doctorNote),
    disclaimer: sanitizeForPdf(s.disclaimer),
  }
}

const styles = StyleSheet.create({
  coverPage: {
    padding: 40,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
  },
  coverLogoLine: {
    height: 2,
    backgroundColor: GREEN,
    marginTop: 12,
    marginBottom: 28,
    width: '100%',
  },
  coverTitle: {
    fontFamily: 'Times-Bold',
    fontSize: 22,
    color: GREEN,
    textAlign: 'center',
    lineHeight: 1.35,
    marginBottom: 8,
  },
  coverSub: {
    fontSize: 11,
    color: MUTED,
    textAlign: 'center',
    marginBottom: 20,
  },
  coverDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    marginVertical: 16,
  },
  patientBox: {
    backgroundColor: LIGHT_GREEN,
    borderWidth: 1,
    borderColor: '#c3e6cb',
    borderRadius: 4,
    padding: 16,
    marginTop: 8,
  },
  patientRow: { fontSize: 10.5, color: TEXT, marginBottom: 8, lineHeight: 1.7 },
  patientLabel: { fontFamily: 'Helvetica-Bold', color: GREEN },
  confidential: {
    marginTop: 12,
    fontSize: 8,
    letterSpacing: 2,
    color: MUTED,
    textAlign: 'center',
  },
  coverFooter: {
    position: 'absolute',
    bottom: 32,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: MUTED,
  },
  bodyPage: {
    padding: 40,
    paddingBottom: 52,
    fontFamily: 'Helvetica',
    fontSize: 10.5,
    color: TEXT,
    lineHeight: 1.7,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: GREEN,
    paddingBottom: 6,
    marginBottom: 12,
  },
  headerLeft: { fontSize: 8, color: GREEN, fontFamily: 'Helvetica-Bold' },
  headerCenter: { fontSize: 8, color: TEXT, maxWidth: 240, textAlign: 'center' },
  headerRight: { fontSize: 7, color: MUTED },
  sectionBar: {
    backgroundColor: GREEN,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginTop: 24,
    marginBottom: 16,
  },
  sectionBarFirst: {
    backgroundColor: GREEN,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginTop: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
  },
  bodyText: {
    fontSize: 10.5,
    color: TEXT,
    lineHeight: 1.7,
    marginBottom: 8,
  },
  bodyItalic: {
    fontSize: 10.5,
    fontStyle: 'italic',
    color: MUTED,
    lineHeight: 1.7,
    marginBottom: 16,
  },
  deficiencyCard: {
    marginBottom: 20,
    padding: 14,
    borderRadius: 6,
    backgroundColor: ROW_BG,
    borderLeftWidth: 4,
    borderLeftColor: GREEN,
  },
  fieldLabel: {
    fontFamily: 'Helvetica-Bold',
    color: GREEN,
    fontSize: 10,
    marginBottom: 8,
    lineHeight: 1.6,
  },
  fieldValue: {
    fontSize: 10.5,
    lineHeight: 1.7,
    marginBottom: 8,
    color: TEXT,
  },
  dayHeader: {
    backgroundColor: LIGHT_GREEN,
    padding: 8,
    marginBottom: 10,
    color: GREEN,
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
  },
  mealRow: {
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  mealLabel: {
    fontFamily: 'Helvetica-Bold',
    color: GREEN,
    fontSize: 10.5,
    marginBottom: 4,
  },
  supplementCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d4edda',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  supplementFieldLabel: {
    fontFamily: 'Helvetica-Bold',
    color: GREEN,
    fontSize: 10,
    marginBottom: 8,
  },
  supplementFieldValue: {
    fontSize: 10,
    marginBottom: 8,
    lineHeight: 1.7,
    color: TEXT,
  },
  safetyBox: {
    backgroundColor: LIGHT_GREEN,
    padding: 8,
    marginTop: 10,
    borderRadius: 4,
    fontSize: 9,
    lineHeight: 1.5,
    color: TEXT,
  },
  foodBox: {
    marginBottom: 14,
    padding: 12,
    borderRadius: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  avoidLabel: { fontFamily: 'Helvetica-Bold', color: RED, fontSize: 10, marginBottom: 6 },
  tryLabel: { fontFamily: 'Helvetica-Bold', color: GREEN, fontSize: 10, marginTop: 8, marginBottom: 4 },
  routineRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-start' },
  routineTime: { width: 80, fontFamily: 'Helvetica-Bold', color: GREEN, fontSize: 10.5 },
  routineBody: { flex: 1, fontSize: 10.5, lineHeight: 1.7, color: TEXT },
  doctorBox: {
    backgroundColor: CREAM,
    borderWidth: 1,
    borderColor: '#e8e0d0',
    padding: 14,
    marginTop: 12,
  },
  doctorItalic: {
    fontSize: 10.5,
    fontStyle: 'italic',
    color: TEXT,
    lineHeight: 1.7,
  },
  signatureLine: {
    marginTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: TEXT,
    width: 140,
  },
  disclaimer: {
    marginTop: 16,
    fontSize: 8,
    color: MUTED,
    lineHeight: 1.5,
  },
})

function SectionHeader({ title, first }: { title: string; first?: boolean }) {
  return (
    <View wrap={false}>
      <View style={first ? styles.sectionBarFirst : styles.sectionBar}>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
    </View>
  )
}

function renderDeficiencyBlocks(text: string) {
  const parts = text.split(/(?=\n{0,2}DEFICIENCY NAME:)/i).map((p) => p.trim()).filter(Boolean)
  return parts.map((block, idx) => (
    <View key={idx} style={styles.deficiencyCard} wrap={false}>
      {block.split('\n').map((line, j) => {
        const upper = line.toUpperCase()
        if (
          upper.startsWith('DEFICIENCY NAME:') ||
          upper.startsWith('SEVERITY:') ||
          upper.startsWith('YOUR SYMPTOMS') ||
          upper.startsWith('WHY THIS IS HAPPENING') ||
          upper.startsWith('WHAT THIS MEANS')
        ) {
          return (
            <Text key={j} style={styles.fieldLabel}>
              {line}
            </Text>
          )
        }
        return (
          <Text key={j} style={styles.fieldValue}>
            {line}
          </Text>
        )
      })}
    </View>
  ))
}

function renderMealPlanBlocks(text: string) {
  const days = text.split(/(?=\n{0,2}DAY\s+\d)/i).map((d) => d.trim()).filter(Boolean)
  return days.map((dayBlock, idx) => {
    const lines = dayBlock.split('\n')
    const firstLine = lines[0] || ''
    const rest = lines.slice(1).join('\n')
    const mealChunks = rest.split(/(?=\n(?:BREAKFAST|MID-MORNING|LUNCH|EVENING SNACK|DINNER)\s*[—-])/i)
    return (
      <View key={idx} style={{ marginBottom: 20 }} wrap={false}>
        <Text style={styles.dayHeader}>{firstLine}</Text>
        {mealChunks
          .map((c) => c.trim())
          .filter(Boolean)
          .map((chunk, j) => {
            const nl = chunk.indexOf('\n')
            const label = nl === -1 ? chunk : chunk.slice(0, nl).trim()
            const desc = nl === -1 ? '' : chunk.slice(nl + 1).trim()
            const whyIdx = desc.search(/\n\s*(Why|WHY)[:\s]/i)
            const main = whyIdx === -1 ? desc : desc.slice(0, whyIdx).trim()
            const why = whyIdx === -1 ? '' : desc.slice(whyIdx).replace(/^\n+/, '').trim()
            return (
              <View key={j} style={styles.mealRow}>
                <Text style={styles.mealLabel}>{label}</Text>
                {main ? (
                  <Text style={{ fontSize: 10.5, lineHeight: 1.7, color: TEXT, marginBottom: 4 }}>{main}</Text>
                ) : null}
                {why ? <Text style={styles.bodyItalic}>{why}</Text> : null}
              </View>
            )
          })}
      </View>
    )
  })
}

function renderSupplementCardLines(lines: string[]) {
  const nodes: React.ReactNode[] = []
  lines.forEach((line, j) => {
    const u = line.toUpperCase()
    if (
      u.startsWith('SUPPLEMENT:') ||
      u.startsWith('WHY YOU NEED') ||
      u.startsWith('RECOMMENDED BRAND') ||
      u.startsWith('DOSAGE:') ||
      u.startsWith('WHEN TO TAKE') ||
      u.startsWith('DURATION:') ||
      u.startsWith('FOOD SOURCES')
    ) {
      nodes.push(
        <Text key={j} style={styles.supplementFieldLabel}>
          {line}
        </Text>,
      )
      return
    }
    nodes.push(
      <Text key={j} style={styles.supplementFieldValue}>
        {line}
      </Text>,
    )
  })
  return nodes
}

function renderSupplementCards(text: string) {
  const blocks = text.split(/(?=\n{0,2}SUPPLEMENT:)/i).map((b) => b.trim()).filter(Boolean)
  return blocks.map((block, idx) => {
    const cleaned = block
      .split('\n')
      .filter((line) => !line.trim().startsWith('─') && !/^-{3,}$/.test(line.trim()))
    const joined = cleaned.join('\n')
    const safetySplit = joined.split(/\n(?=SAFETY\s*:)/i)
    const mainPart = (safetySplit[0] || '').trim()
    const safetyPart = safetySplit.slice(1).join('\n').trim()
    const mainLines = mainPart ? mainPart.split('\n') : []
    return (
      <View key={idx} style={styles.supplementCard} wrap={false}>
        {renderSupplementCardLines(mainLines)}
        {safetyPart ? (
          <View style={styles.safetyBox}>
            <Text style={{ fontSize: 9, lineHeight: 1.5 }}>{safetyPart}</Text>
          </View>
        ) : null}
      </View>
    )
  })
}

function renderFoodBlocks(text: string) {
  const blocks = text.split(/(?=\n{0,2}(?:\[AVOID\]))/).map((b) => b.trim()).filter(Boolean)
  return blocks.map((block, idx) => (
    <View key={idx} style={styles.foodBox} wrap={false}>
      {block.split('\n').map((line, j) => {
        const t = line.trim()
        if (t.startsWith('[AVOID]')) {
          return (
            <Text key={j} style={styles.avoidLabel}>
              {line}
            </Text>
          )
        }
        if (t.startsWith('[TRY INSTEAD]')) {
          return (
            <Text key={j} style={styles.tryLabel}>
              {line}
            </Text>
          )
        }
        if (t.toUpperCase().startsWith('WHY')) {
          return (
            <Text key={j} style={styles.fieldValue}>
              {line}
            </Text>
          )
        }
        return (
          <Text key={j} style={{ fontSize: 10.5, lineHeight: 1.7, marginBottom: 4 }}>
            {line}
          </Text>
        )
      })}
    </View>
  ))
}

function renderRoutineRows(text: string) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  const rows: { time: string; body: string }[] = []
  let cur: { time: string; body: string } | null = null
  for (const line of lines) {
    const m = line.match(/^(\d{1,2}:\d{2}\s*(?:AM|PM)?|\d{1,2}\s*(?:AM|PM))\s*[—\-–]\s*(.+)$/i)
    if (m) {
      if (cur) rows.push(cur)
      cur = { time: m[1], body: m[2] }
    } else if (cur) {
      cur.body += `\n${line}`
    } else {
      rows.push({ time: '', body: line })
    }
  }
  if (cur) rows.push(cur)
  return rows.map((r, idx) => {
    const parts = r.body.split(/\n(?=WHY)/i)
    const main = parts[0] || ''
    const why = parts[1] || ''
    return (
      <View key={idx} style={styles.routineRow} wrap={false}>
        <Text style={styles.routineTime}>{r.time}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.routineBody}>{main}</Text>
          {why ? <Text style={styles.bodyItalic}>{why.trim()}</Text> : null}
        </View>
      </View>
    )
  })
}

type DocProps = {
  patientName: string
  reportId: string
  preparedOn: string
  sections: RecoveryReportSections
}

function RecoveryPlanDocument({ patientName, reportId, preparedOn, sections }: DocProps) {
  const headerCenter = `Personalised Recovery Report — ${patientName}`

  return (
    <Document title={`Recovery Plan — ${reportId}`} author="The Beetamin" subject="Wellness report">
      <Page size="A4" style={styles.coverPage}>
        <Text style={{ fontSize: 14, color: GREEN, textAlign: 'center', fontFamily: 'Helvetica-Bold' }}>
          The Beetamin
        </Text>
        <View style={styles.coverLogoLine} />
        <Text style={styles.coverTitle}>PERSONALISED DEFICIENCY{'\n'}RECOVERY REPORT</Text>
        <Text style={styles.coverSub}>Prepared by The Beetamin Wellness Clinic</Text>
        <View style={styles.coverDivider} />
        <View style={styles.patientBox}>
          <Text style={styles.patientRow}>
            <Text style={styles.patientLabel}>Patient Name: </Text>
            {patientName}
          </Text>
          <Text style={styles.patientRow}>
            <Text style={styles.patientLabel}>Report ID: </Text>
            {reportId}
          </Text>
          <Text style={styles.patientRow}>
            <Text style={styles.patientLabel}>Prepared On: </Text>
            {preparedOn}
          </Text>
          <Text style={styles.patientRow}>
            <Text style={styles.patientLabel}>Prepared By: </Text>
            Dr. Priya Sharma, Clinical Nutritionist
          </Text>
          <Text style={styles.confidential}>CONFIDENTIAL</Text>
        </View>
        <Text style={styles.coverFooter}>
          thebeetamin.com · For wellness guidance only — not a substitute for medical advice
        </Text>
      </Page>

      <Page size="A4" style={styles.bodyPage} wrap>
        <View style={styles.headerRow} fixed>
          <Text style={styles.headerLeft}>The Beetamin</Text>
          <Text style={styles.headerCenter}>{headerCenter}</Text>
          <Text style={styles.headerRight}>{reportId}</Text>
        </View>

        <SectionHeader title="SECTION 1 — YOUR DEFICIENCY ANALYSIS" first />
        <View style={{ marginTop: 4 }}>{renderDeficiencyBlocks(sections.deficiencyAnalysis)}</View>

        <SectionHeader title="SECTION 2 — YOUR 7-DAY RECOVERY MEAL PLAN" />
        <View style={{ marginTop: 4 }}>{renderMealPlanBlocks(sections.mealPlan)}</View>

        <SectionHeader title="SECTION 3 — YOUR SUPPLEMENT PLAN" />
        <View style={{ marginTop: 4 }}>{renderSupplementCards(sections.supplements)}</View>

        <SectionHeader title="SECTION 4 — FOODS BLOCKING YOUR RECOVERY" />
        <View style={{ marginTop: 4 }}>{renderFoodBlocks(sections.blockingFoods)}</View>

        <SectionHeader title="SECTION 5 — YOUR PERSONALISED DAILY ROUTINE" />
        <View style={{ marginTop: 4 }}>{renderRoutineRows(sections.dailyRoutine)}</View>

        <SectionHeader title="SECTION 6 — A NOTE FROM DR. PRIYA" />
        <View style={styles.doctorBox}>
          <Text style={styles.doctorItalic}>{sections.doctorNote}</Text>
          <View style={styles.signatureLine} />
          <Text style={{ marginTop: 8, fontSize: 10.5, fontFamily: 'Helvetica-Bold' }}>Dr. Priya Sharma</Text>
          <Text style={{ fontSize: 8, color: MUTED, marginTop: 2 }}>
            Clinical Nutritionist | M.Sc Nutrition & Dietetics · Reg. No. NUT-2847
          </Text>
          <Text style={{ fontSize: 8, color: MUTED }}>The Beetamin Wellness Clinic</Text>
        </View>

        <SectionHeader title="DISCLAIMER" />
        <Text style={styles.disclaimer}>{sections.disclaimer}</Text>
        <Text style={{ marginTop: 12, fontSize: 8, color: GREEN, fontFamily: 'Helvetica-Bold' }}>
          This report was prepared exclusively for {patientName}
        </Text>

        <View
          style={{
            position: 'absolute',
            bottom: 14,
            left: 40,
            right: 40,
            borderTopWidth: 0.5,
            borderTopColor: '#cccccc',
            paddingTop: 6,
          }}
          fixed
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
            <Text style={{ fontSize: 7, color: MUTED }}>thebeetamin.com</Text>
            <Text style={{ fontSize: 7, color: MUTED }}>Report ID: {reportId}</Text>
            <Text
              style={{ fontSize: 7, color: MUTED }}
              render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
            />
          </View>
          <Text style={{ fontSize: 6.5, color: MUTED, textAlign: 'center' }}>
            For wellness guidance only — not a substitute for medical advice
          </Text>
        </View>
      </Page>
    </Document>
  )
}

export async function generateRecoveryPlanPdfBuffer(input: {
  patientName: string
  reportId: string
  preparedOn: string
  sections: RecoveryReportSections
}): Promise<Buffer> {
  const clean = sanitizeSections(input.sections)
  const doc = (
    <RecoveryPlanDocument
      patientName={input.patientName}
      reportId={input.reportId}
      preparedOn={input.preparedOn}
      sections={clean}
    />
  )
  const buf = await renderToBuffer(doc)
  return Buffer.from(buf)
}
