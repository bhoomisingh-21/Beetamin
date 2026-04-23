import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer'
import type { RecoveryReportSections } from '@/lib/recovery-report-types'

const GREEN = '#1a472a'
const LIGHT_GREEN = '#d4edda'
const TEXT = '#1a1a1a'
const MUTED = '#666666'
const ROW_BG = '#f8f9fa'
const CREAM = '#faf8f2'

const styles = StyleSheet.create({
  coverPage: {
    padding: 48,
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
  patientRow: { fontSize: 10, color: TEXT, marginBottom: 4 },
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
    bottom: 40,
    left: 48,
    right: 48,
    textAlign: 'center',
    fontSize: 8,
    color: MUTED,
  },
  bodyPage: {
    paddingTop: 52,
    paddingBottom: 56,
    paddingHorizontal: 44,
    fontFamily: 'Helvetica',
    fontSize: 9.5,
    color: TEXT,
    lineHeight: 1.45,
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
    marginTop: 14,
    marginBottom: 8,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
  },
  bodyText: {
    fontSize: 9.5,
    color: TEXT,
    lineHeight: 1.5,
    marginBottom: 4,
  },
  doctorBox: {
    backgroundColor: CREAM,
    borderWidth: 1,
    borderColor: '#e8e0d0',
    padding: 14,
    marginTop: 12,
  },
  doctorItalic: {
    fontSize: 10,
    fontStyle: 'italic',
    color: TEXT,
    lineHeight: 1.55,
  },
  signatureLine: {
    marginTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: TEXT,
    width: 140,
  },
  disclaimer: {
    marginTop: 16,
    fontSize: 7.5,
    color: MUTED,
    lineHeight: 1.4,
  },
})

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
}

function ParagraphBlock({ text }: { text: string }) {
  const paras = splitParagraphs(text)
  return (
    <View>
      {paras.map((p, i) => (
        <View key={i} style={{ marginBottom: 6 }}>
          {p.split('\n').map((line, j) => (
            <Text key={j} style={styles.bodyText}>
              {line}
            </Text>
          ))}
        </View>
      ))}
    </View>
  )
}

function SectionBlock({ title, body }: { title: string; body: string }) {
  return (
    <View>
      <View style={styles.sectionBar}>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <ParagraphBlock text={body} />
    </View>
  )
}

type Props = {
  patientName: string
  reportId: string
  preparedOn: string
  sections: RecoveryReportSections
}

export function RecoveryPlanDocument({ patientName, reportId, preparedOn, sections }: Props) {
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

        <SectionBlock title="SECTION 1 — YOUR DEFICIENCY ANALYSIS" body={sections.deficiencyAnalysis} />
        <SectionBlock title="SECTION 2 — YOUR 7-DAY RECOVERY MEAL PLAN" body={sections.mealPlan} />
        <SectionBlock title="SECTION 3 — YOUR SUPPLEMENT PLAN" body={sections.supplements} />
        <SectionBlock title="SECTION 4 — FOODS BLOCKING YOUR RECOVERY" body={sections.blockingFoods} />
        <SectionBlock title="SECTION 5 — YOUR PERSONALISED DAILY ROUTINE" body={sections.dailyRoutine} />

        <View style={styles.sectionBar}>
          <Text style={styles.sectionTitle}>SECTION 6 — A NOTE FROM DR. PRIYA</Text>
        </View>
        <View style={styles.doctorBox}>
          <Text style={styles.doctorItalic}>{sections.doctorNote}</Text>
          <View style={styles.signatureLine} />
          <Text style={{ marginTop: 8, fontSize: 10, fontFamily: 'Helvetica-Bold' }}>Dr. Priya Sharma</Text>
          <Text style={{ fontSize: 8, color: MUTED, marginTop: 2 }}>
            Clinical Nutritionist | M.Sc Nutrition & Dietetics · Reg. No. NUT-2847
          </Text>
          <Text style={{ fontSize: 8, color: MUTED }}>The Beetamin Wellness Clinic</Text>
        </View>

        <View style={styles.sectionBar}>
          <Text style={styles.sectionTitle}>DISCLAIMER</Text>
        </View>
        <Text style={styles.disclaimer}>{sections.disclaimer}</Text>
        <Text style={{ marginTop: 12, fontSize: 8, color: GREEN, fontFamily: 'Helvetica-Bold' }}>
          This report was prepared exclusively for {patientName}
        </Text>

        <View
          style={{
            position: 'absolute',
            bottom: 14,
            left: 44,
            right: 44,
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
