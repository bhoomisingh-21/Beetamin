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

/** Strip emojis and unsafe characters for react-pdf (Helvetica). */
export function sanitizeForPdf(raw: string | null | undefined): string {
  let t = String(raw ?? '')
  const pairs: [RegExp, string][] = [
    [/🌅\s*/g, ''],
    [/🍎\s*/g, ''],
    [/☀️\s*/g, ''],
    [/🌿\s*/g, ''],
    [/🌙\s*/g, ''],
    [/⏰\s*/g, ''],
    [/❌\s*/g, '[AVOID] '],
    [/✅\s*/g, '[SWAP] '],
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
  t = t.replace(/\[TRY INSTEAD\]/gi, '[SWAP]')
  t = t.replace(/\uFE0F/g, '')
  try {
    t = t.replace(/\p{Extended_Pictographic}/gu, '')
  } catch {
    t = t.replace(/[\u231A-\u231B\u23E9-\u23EC\u23F0\u23F3\u25FD-\u25FE\u2614-\u2615\u2648-\u2653\u267F\u2693\u26A1\u26AA-\u26AB\u26BD-\u26BE\u26C4-\u26C5\u26CE\u26D4\u26EA\u26F2-\u26F3\u26F5\u26FA\u26FD\u2705\u270A-\u270B\u2728\u274C\u274E\u2753-\u2755\u2757\u2795-\u2797\u27B0\u27BF\u2B1B-\u2B1C\u2B50\u2B55]/g, '')
  }
  t = t.replace(/^\s*[\u2022•*]\s+/gm, '- ')
  return t.replace(/\n{3,}/g, '\n\n').trim()
}

function sanitizeSections(s: RecoveryReportSections): RecoveryReportSections {
  return {
    deficiencyAnalysis: sanitizeForPdf(s?.deficiencyAnalysis),
    mealPlan: sanitizeForPdf(s?.mealPlan),
    supplements: sanitizeForPdf(s?.supplements),
    blockingFoods: sanitizeForPdf(s?.blockingFoods),
    dailyRoutine: sanitizeForPdf(s?.dailyRoutine),
    doctorNote: sanitizeForPdf(s?.doctorNote),
    disclaimer: sanitizeForPdf(s?.disclaimer),
  }
}

const styles = StyleSheet.create({
  coverPage: {
    padding: 40,
    backgroundColor: '#ffffff',
  },
  coverBrand: {
    fontSize: 14,
    fontWeight: 'bold',
    color: GREEN,
    textAlign: 'center',
    marginBottom: 10,
  },
  coverLine: {
    backgroundColor: GREEN,
    paddingTop: 1,
    paddingBottom: 1,
    marginBottom: 24,
    width: '100%',
  },
  coverTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: GREEN,
    textAlign: 'center',
    lineHeight: 1.4,
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
    borderBottomStyle: 'solid',
    borderBottomColor: '#e5e5e5',
    marginTop: 16,
    marginBottom: 16,
    width: '100%',
  },
  patientBox: {
    backgroundColor: LIGHT_GREEN,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#c3e6cb',
    borderRadius: 4,
    padding: 16,
    marginTop: 8,
  },
  patientRow: {
    fontSize: 11,
    color: TEXT,
    marginBottom: 8,
    lineHeight: 1.5,
  },
  patientLabel: {
    fontWeight: 'bold',
    color: GREEN,
  },
  confidential: {
    marginTop: 12,
    fontSize: 8,
    color: MUTED,
    textAlign: 'center',
  },
  coverFooter: {
    marginTop: 24,
    textAlign: 'center',
    fontSize: 8,
    color: MUTED,
  },
  bodyPage: {
    paddingTop: 40,
    paddingBottom: 40,
    paddingLeft: 40,
    paddingRight: 40,
    fontSize: 10,
    color: TEXT,
    lineHeight: 1.5,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: GREEN,
    paddingBottom: 6,
    marginBottom: 12,
    width: '100%',
  },
  headerLeft: {
    fontSize: 8,
    color: GREEN,
    fontWeight: 'bold',
    width: 72,
  },
  headerMidWrap: {
    flexGrow: 1,
    paddingLeft: 4,
    paddingRight: 4,
  },
  headerCenter: {
    fontSize: 8,
    color: TEXT,
    textAlign: 'center',
    lineHeight: 1.4,
  },
  headerRight: {
    fontSize: 8,
    color: MUTED,
    width: 88,
    textAlign: 'right',
  },
  sectionBar: {
    backgroundColor: GREEN,
    paddingTop: 6,
    paddingBottom: 6,
    paddingLeft: 10,
    paddingRight: 10,
    marginTop: 20,
    marginBottom: 14,
  },
  sectionBarFirst: {
    backgroundColor: GREEN,
    paddingTop: 6,
    paddingBottom: 6,
    paddingLeft: 10,
    paddingRight: 10,
    marginTop: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    lineHeight: 1.4,
  },
  sectionBodyWrap: {
    marginTop: 4,
  },
  bodyText: {
    fontSize: 10,
    color: TEXT,
    lineHeight: 1.5,
    marginBottom: 6,
  },
  bodyItalic: {
    fontSize: 9,
    fontStyle: 'italic',
    color: MUTED,
    lineHeight: 1.5,
    marginBottom: 8,
  },
  deficiencyRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  deficiencyStripe: {
    width: 4,
    backgroundColor: GREEN,
    marginRight: 10,
  },
  deficiencyCardInner: {
    flexGrow: 1,
    backgroundColor: ROW_BG,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#dddddd',
    borderRadius: 6,
    padding: 12,
  },
  fieldLabel: {
    fontWeight: 'bold',
    color: GREEN,
    fontSize: 10,
    marginBottom: 4,
    lineHeight: 1.5,
  },
  fieldValue: {
    fontSize: 10,
    lineHeight: 1.5,
    marginBottom: 6,
    color: TEXT,
  },
  dayBlock: {
    marginBottom: 20,
  },
  dayHeaderBox: {
    backgroundColor: LIGHT_GREEN,
    padding: 8,
    marginBottom: 10,
  },
  dayHeaderText: {
    color: GREEN,
    fontSize: 11,
    fontWeight: 'bold',
    lineHeight: 1.4,
  },
  mealRow: {
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: '#eeeeee',
  },
  mealLabel: {
    fontWeight: 'bold',
    color: GREEN,
    fontSize: 10,
    marginBottom: 4,
    lineHeight: 1.4,
  },
  mealBody: {
    fontSize: 10,
    lineHeight: 1.5,
    color: TEXT,
    marginBottom: 4,
  },
  supplementCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#d4edda',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  supplementFieldLabel: {
    fontWeight: 'bold',
    color: GREEN,
    fontSize: 10,
    marginBottom: 4,
    lineHeight: 1.5,
  },
  supplementFieldValue: {
    fontSize: 10,
    marginBottom: 6,
    lineHeight: 1.5,
    color: TEXT,
  },
  safetyBox: {
    backgroundColor: LIGHT_GREEN,
    padding: 8,
    marginTop: 10,
    borderRadius: 4,
  },
  safetyText: {
    fontSize: 9,
    lineHeight: 1.5,
    color: TEXT,
  },
  foodBox: {
    marginBottom: 14,
    padding: 12,
    borderRadius: 6,
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: '#e5e5e5',
  },
  avoidLabel: {
    fontWeight: 'bold',
    color: RED,
    fontSize: 10,
    marginBottom: 6,
    lineHeight: 1.4,
  },
  tryLabel: {
    fontWeight: 'bold',
    color: GREEN,
    fontSize: 10,
    marginTop: 8,
    marginBottom: 4,
    lineHeight: 1.4,
  },
  routineRow: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  routineTime: {
    width: 80,
    fontWeight: 'bold',
    color: GREEN,
    fontSize: 10,
    lineHeight: 1.5,
  },
  routineBodyCol: {
    flexGrow: 1,
  },
  routineBody: {
    fontSize: 10,
    lineHeight: 1.5,
    color: TEXT,
  },
  doctorBox: {
    backgroundColor: CREAM,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#e8e0d0',
    padding: 14,
    marginTop: 12,
  },
  doctorItalic: {
    fontSize: 10,
    fontStyle: 'italic',
    color: TEXT,
    lineHeight: 1.5,
  },
  signatureLine: {
    marginTop: 20,
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: TEXT,
    width: 140,
  },
  doctorName: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: 'bold',
    color: TEXT,
    lineHeight: 1.4,
  },
  doctorMeta: {
    fontSize: 8,
    color: MUTED,
    marginTop: 2,
    lineHeight: 1.5,
  },
  doctorClinic: {
    fontSize: 8,
    color: MUTED,
    lineHeight: 1.5,
  },
  disclaimer: {
    marginTop: 16,
    fontSize: 8,
    color: MUTED,
    lineHeight: 1.5,
  },
  exclusiveNote: {
    marginTop: 12,
    fontSize: 8,
    color: GREEN,
    fontWeight: 'bold',
    lineHeight: 1.5,
  },
  footerBar: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopStyle: 'solid',
    borderTopColor: '#cccccc',
    paddingTop: 6,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 2,
  },
  footerLeft: {
    fontSize: 8,
    color: MUTED,
    width: 120,
  },
  footerMid: {
    fontSize: 8,
    color: MUTED,
    flexGrow: 1,
    textAlign: 'center',
    paddingLeft: 4,
    paddingRight: 4,
    lineHeight: 1.4,
  },
  footerRight: {
    fontSize: 8,
    color: MUTED,
    width: 96,
    textAlign: 'right',
  },
  footerDisclaimer: {
    fontSize: 8,
    color: MUTED,
    textAlign: 'center',
    marginTop: 4,
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
    <View key={idx} style={styles.deficiencyRow} wrap={false}>
      <View style={styles.deficiencyStripe} />
      <View style={styles.deficiencyCardInner}>
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
      <View key={idx} style={styles.dayBlock} wrap={false}>
        <View style={styles.dayHeaderBox}>
          <Text style={styles.dayHeaderText}>{firstLine}</Text>
        </View>
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
                {main ? <Text style={styles.mealBody}>{main}</Text> : null}
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
            <Text style={styles.safetyText}>{safetyPart}</Text>
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
        if (t.startsWith('[SWAP]') || t.startsWith('[TRY INSTEAD]')) {
          return (
            <Text key={j} style={styles.tryLabel}>
              {t.startsWith('[TRY INSTEAD]') ? line.replace(/\[TRY INSTEAD\]/gi, '[SWAP]') : line}
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
          <Text key={j} style={styles.mealBody}>
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
        <View style={styles.routineBodyCol}>
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
        <Text style={styles.coverBrand}>The Beetamin</Text>
        <View style={styles.coverLine} />
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
          <View style={styles.headerMidWrap}>
            <Text style={styles.headerCenter}>{headerCenter}</Text>
          </View>
          <Text style={styles.headerRight}>{reportId}</Text>
        </View>

        <SectionHeader title="SECTION 1 — YOUR DEFICIENCY ANALYSIS" first />
        <View style={styles.sectionBodyWrap}>{renderDeficiencyBlocks(sections.deficiencyAnalysis)}</View>

        <SectionHeader title="SECTION 2 — YOUR 7-DAY RECOVERY MEAL PLAN" />
        <View style={styles.sectionBodyWrap}>{renderMealPlanBlocks(sections.mealPlan)}</View>

        <SectionHeader title="SECTION 3 — YOUR SUPPLEMENT PLAN" />
        <View style={styles.sectionBodyWrap}>{renderSupplementCards(sections.supplements)}</View>

        <SectionHeader title="SECTION 4 — FOODS BLOCKING YOUR RECOVERY" />
        <View style={styles.sectionBodyWrap}>{renderFoodBlocks(sections.blockingFoods)}</View>

        <SectionHeader title="SECTION 5 — YOUR PERSONALISED DAILY ROUTINE" />
        <View style={styles.sectionBodyWrap}>{renderRoutineRows(sections.dailyRoutine)}</View>

        <SectionHeader title="SECTION 6 — A NOTE FROM DR. PRIYA" />
        <View style={styles.doctorBox}>
          <Text style={styles.doctorItalic}>{sections.doctorNote}</Text>
          <View style={styles.signatureLine} />
          <Text style={styles.doctorName}>Dr. Priya Sharma</Text>
          <Text style={styles.doctorMeta}>
            Clinical Nutritionist | M.Sc Nutrition & Dietetics · Reg. No. NUT-2847
          </Text>
          <Text style={styles.doctorClinic}>The Beetamin Wellness Clinic</Text>
        </View>

        <SectionHeader title="DISCLAIMER" />
        <Text style={styles.disclaimer}>{sections.disclaimer}</Text>
        <Text style={styles.exclusiveNote}>This report was prepared exclusively for {patientName}</Text>

        <View style={styles.footerBar}>
          <View style={styles.footerRow}>
            <Text style={styles.footerLeft}>thebeetamin.com</Text>
            <Text style={styles.footerMid}>Report ID: {reportId}</Text>
            <Text
              style={styles.footerRight}
              render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
            />
          </View>
          <Text style={styles.footerDisclaimer}>
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
  try {
    const buf = await renderToBuffer(doc)
    return Buffer.from(buf)
  } catch (err) {
    console.error('[PDF Generation Error]', err)
    throw err
  }
}
