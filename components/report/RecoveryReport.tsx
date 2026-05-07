import React from 'react'
import { Document, Page, Text, View, Svg, Path, Image } from '@react-pdf/renderer'
import type { Style } from '@react-pdf/types'
import type { RecoveryReportV2Data, RecoverySubScoresV2, ShoppingListV2 } from '@/lib/recovery-report-v2-types'
import { COLORS, getSeverityStyle, getSubScoreBarColor, styles } from './recovery-pdf-styles'
import {
  COVER_IMAGE_BOTTOM_LEFT,
  COVER_IMAGE_HERO,
  DOCTOR_AVATAR,
  FOODS_AVOID_JUNK,
  FOODS_EAT_FRESH,
  HEALTH_SCORE_WELLNESS,
  MEAL_PLAN_BANNER,
  SUPPLEMENT_SECTION_BANNER,
  TIMELINE_BANNER,
  dayFoodImages,
  getDeficiencyImageUrl,
  getSupplementImageUrl,
} from './recovery-pdf-images'

const STANDARD_DISCLAIMER =
  'Prepared for wellness guidance only. Not a medical diagnosis. Consult your physician before supplements or major diet changes, especially if pregnant, on medication, or managing chronic disease.'

/** Shorter strip for repeated interior footers */
const FOOTER_DISCLAIMER =
  'Prepared for wellness guidance only — not a medical diagnosis. Consult your physician before supplements or diet changes.'

const TOTAL_PAGES_LABEL = '14'

function polarToCartesian(cx: number, cy: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0
  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians),
  }
}

/** SVG arc path from startAngle → endAngle (degrees, clockwise sweep when end > start). */
function describeArc(cx: number, cy: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, radius, endAngle)
  const end = polarToCartesian(cx, cy, radius, startAngle)
  const delta = endAngle - startAngle
  const largeArcFlag = Math.abs(delta) > 180 ? 1 : 0
  const sweepFlag = delta > 0 ? 1 : 0
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${end.x} ${end.y}`
}

function AbsorptionScoreRing({ score }: { score: number }) {
  const cx = 44
  const cy = 44
  const r = 34
  const clamped = Math.min(100, Math.max(0, Math.round(score)))
  const progressEnd = -90 + (clamped / 100) * 359.99
  const trackPath = describeArc(cx, cy, r, -90, 269.99)
  const fillPath = clamped <= 0 ? null : describeArc(cx, cy, r, -90, progressEnd)
  return (
    <View style={{ width: 88, height: 88, marginRight: 14 }}>
      <View style={{ position: 'relative', width: 88, height: 88 }}>
        <Svg width={88} height={88} viewBox="0 0 88 88">
          <Path d={trackPath} stroke={COLORS.gray200} strokeWidth={9} fill="none" strokeLinecap="round" />
          {fillPath ? (
            <Path d={fillPath} stroke={COLORS.emerald} strokeWidth={9} fill="none" strokeLinecap="round" />
          ) : null}
        </Svg>
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 88,
            height: 88,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: 700, color: COLORS.emerald }}>{clamped}</Text>
        </View>
      </View>
    </View>
  )
}

/** Split strings like “Walnuts — 200g/week” into title + subtitle */
function splitFoodQuantity(line: string): { title: string; qty: string } {
  const seps = [' — ', ' – ', ' - ', ' · ']
  for (const s of seps) {
    const i = line.indexOf(s)
    if (i > 0) {
      return { title: line.slice(0, i).trim(), qty: line.slice(i + s.length).trim() }
    }
  }
  return { title: line.trim(), qty: '' }
}

function estimateLevelTone(text: string): 'red' | 'amber' | 'neutral' {
  const t = text.toLowerCase()
  if (/\b(low|suboptimal|deficient|insufficient|<\s*\d)/i.test(t)) return 'red'
  if (/\b(likely|borderline|may|moderate|estimated)/i.test(t)) return 'amber'
  return 'neutral'
}

function ReportInteriorPage({
  patientName,
  reportId,
  children,
}: {
  patientName: string
  reportId: string
  children: React.ReactNode
}) {
  const rid = reportId.trim() || '—'
  return (
    <Page size="A4" style={styles.reportInnerPage} wrap={false}>
      <View style={styles.topAccentBar} />
      <View style={styles.pageHeader}>
        <View style={styles.pageHeaderBrandWrap}>
          <LeafBrandSvg size={14} />
          <Text style={styles.headerBrand}>TheBeetamin · Recovery Blueprint</Text>
        </View>
        <View style={styles.pageHeaderPatientCol}>
          <Text style={styles.headerPatientName}>{patientName}</Text>
          <Text style={styles.headerMeta}>Report ID · {rid}</Text>
        </View>
      </View>
      <View style={styles.pageInnerContent}>{children}</View>
      <View style={styles.pageFooterRow} wrap={false}>
        <Text style={styles.footerDisclaimerShort}>{FOOTER_DISCLAIMER}</Text>
        <Text
          style={styles.footerPageNumber}
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`}
        />
      </View>
    </Page>
  )
}

/** Network images: `cache` avoids refetch during multi-page render; errors surface at PDF build time. */
function SafeImage(props: { src: string; style: Style | Style[] }) {
  return <Image src={props.src} style={props.style} cache />
}

function LeafBrandSvg({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M17 8C8 10 5.9 16.17 3.82 19.5c2.33 1.17 5.12.5 6.65-1.5C12 15.67 14 10 17 8z" fill={COLORS.emerald} />
      <Path d="M17 8c0 5.52-4.48 10-10 10-.45 0-.9-.03-1.34-.08" fill="none" stroke={COLORS.emerald} strokeWidth={1.5} />
    </Svg>
  )
}

function formatReportDate(iso?: string) {
  if (!iso) return new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function HealthScoreSection({ data }: { data: RecoveryReportV2Data }) {
  const s = data.subScores
  const rows: {
    key: keyof Pick<
      RecoverySubScoresV2,
      'energyVitality' | 'skinHairNails' | 'immunity' | 'cognitiveClarity' | 'sleepHormones'
    >
    label: string
    sub: keyof Pick<
      RecoverySubScoresV2,
      'energyLabel' | 'skinHairLabel' | 'immunityLabel' | 'cognitiveLabel' | 'sleepLabel'
    >
    val: number
  }[] = [
    { key: 'energyVitality', label: 'Energy & vitality', sub: 'energyLabel', val: s.energyVitality },
    { key: 'skinHairNails', label: 'Skin, hair & nails', sub: 'skinHairLabel', val: s.skinHairNails },
    { key: 'immunity', label: 'Immunity load', sub: 'immunityLabel', val: s.immunity },
    { key: 'cognitiveClarity', label: 'Cognitive clarity', sub: 'cognitiveLabel', val: s.cognitiveClarity },
    { key: 'sleepHormones', label: 'Sleep & hormones', sub: 'sleepLabel', val: s.sleepHormones },
  ]

  let status = 'On your way up'
  if (data.healthScore < 45) status = 'Priority repair window'
  else if (data.healthScore < 65) status = 'Meaningful optimisation'

  return (
    <View wrap={false} style={styles.healthScoreSectionOuter}>
      <SafeImage src={HEALTH_SCORE_WELLNESS} style={[styles.healthWellnessCircle, { objectFit: 'cover' }]} />

      <Text style={styles.sectionLabel}>DASHBOARD</Text>
      <Text style={styles.sectionTitle}>Health score dashboard</Text>
      <View style={styles.sectionDivider} />

      <View style={styles.scoreCard} wrap={false}>
        <Text style={styles.scoreBig}>{data.healthScore}</Text>
        <Text style={styles.scoreSlash}>/100</Text>
        <View style={styles.scoreMeta}>
          <Text style={styles.scoreStatus}>{status}</Text>
          <Text style={styles.scoreNote}>{data.scoreInterpretation}</Text>
        </View>
      </View>

      {rows.map((r) => (
        <View key={r.key}>
          <View style={styles.subScoreRow}>
            <Text style={styles.subScoreLabel}>{r.label}</Text>
            <View style={styles.subScoreBarBg}>
              <View
                style={[
                  styles.subScoreBarFill,
                  {
                    width: `${Math.min(100, Math.max(0, r.val))}%`,
                    backgroundColor: getSubScoreBarColor(r.val),
                  },
                ]}
              />
            </View>
            <Text style={styles.subScoreNum}>{r.val}</Text>
          </View>
          <Text style={styles.subScoreNote}>{s[r.sub]}</Text>
        </View>
      ))}
    </View>
  )
}
function DeficienciesSection({ data }: { data: RecoveryReportV2Data }) {
  return (
    <View>
      <Text style={styles.sectionLabel}>ANALYSIS</Text>
      <Text style={styles.sectionTitle}>Deficiencies in focus</Text>
      <View style={styles.sectionDivider} />

      {data.primaryDeficiencies.map((def, idx) => {
        const sv = getSeverityStyle(def.severity)
        return (
          <View
            key={idx}
            style={[
              styles.defCard,
              { backgroundColor: sv.bg, borderLeftWidth: 3, borderLeftColor: sv.border },
              styles.defCardOuterRow,
            ]}
            wrap={false}
          >
            <View style={styles.defCardTextCol}>
              <View style={styles.defCardTop}>
                <Text style={styles.defNutrient}>{def.nutrient}</Text>
                <View
                  style={[
                    styles.severityBadge,
                    { backgroundColor: COLORS.white, borderWidth: 1, borderColor: sv.border },
                  ]}
                >
                  <Text style={[styles.severityText, { color: sv.text }]}>{def.severity.toUpperCase()}</Text>
                </View>
              </View>
              {def.tagline ? <Text style={styles.defTagline}>{def.tagline}</Text> : null}
              <View style={styles.severityBarOuter}>
                <View style={[styles.severityBarInner, { width: `${sv.pct}%`, backgroundColor: sv.bar }]} />
              </View>
              {def.whatItMeans ? (
                <>
                  <Text style={styles.defLabel}>What it means</Text>
                  <Text style={styles.defBody}>{def.whatItMeans}</Text>
                </>
              ) : null}
              {def.whyTheyHaveIt ? (
                <>
                  <Text style={styles.defLabel}>Why you show this pattern</Text>
                  <Text style={styles.defBody}>{def.whyTheyHaveIt}</Text>
                </>
              ) : null}
              {def.symptomsTheyFeel.length > 0 ? (
                <>
                  <Text style={styles.defLabel}>Symptoms you connected to this</Text>
                  {def.symptomsTheyFeel.map((sym, i) => (
                    <View key={i} style={styles.symptomRow} wrap={false}>
                      <View style={styles.symptomDotOuter} />
                      <Text style={styles.symptomText}>{sym}</Text>
                    </View>
                  ))}
                </>
              ) : null}
              {def.bodyImpact ? (
                <>
                  <Text style={styles.defLabel}>What it can do day to day</Text>
                  <Text style={styles.defBody}>{def.bodyImpact}</Text>
                </>
              ) : null}
              {def.recoveryTime ? (
                <>
                  <Text style={styles.defLabel}>Expected recovery window</Text>
                  <Text style={[styles.defBody, { color: COLORS.emeraldDark, fontWeight: 700 }]}>
                    {def.recoveryTime}
                  </Text>
                </>
              ) : null}
            </View>
            <View style={styles.defCardImageCol}>
              <SafeImage src={getDeficiencyImageUrl(def.nutrient)} style={styles.defCardThumbSq} />
            </View>
          </View>
        )
      })}
    </View>
  )
}

function SymptomMapAndBlockersSection({ data }: { data: RecoveryReportV2Data }) {
  const map = data.symptomDeficiencyMap
  const blockers = data.recoveryBlockers
  if (map.length === 0 && blockers.length === 0) return null

  return (
    <View style={{ marginTop: 10 }}>
      {map.length > 0 ? (
        <>
          <Text style={styles.sectionLabel}>YOUR PATTERN</Text>
          <Text style={styles.sectionTitle}>Symptom → deficiency map</Text>
          <Text style={styles.sectionSubtitle}>How what you feel lines up with the gaps we are fixing.</Text>
          <View style={styles.sectionDivider} />
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { width: '28%' }]}>SYMPTOM</Text>
            <Text style={[styles.tableHeaderText, { width: '22%' }]}>GAP</Text>
            <Text style={[styles.tableHeaderText, { width: '50%' }]}>WHY IT FITS YOU</Text>
          </View>
          {map.map((row, i) => (
            <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]} wrap={false}>
              <Text style={[styles.tableCellText, { width: '28%', fontWeight: 700 }]}>{row.symptom}</Text>
              <Text style={[styles.tableEmphasisEmerald, { width: '22%' }]}>{row.nutrient}</Text>
              <Text style={[styles.tableCellText, { width: '50%', fontStyle: 'italic', color: COLORS.emeraldDark }]}>
                {row.link}
              </Text>
            </View>
          ))}
        </>
      ) : null}

      {blockers.length > 0 ? (
        <View style={{ marginTop: map.length > 0 ? 12 : 0 }} wrap={false}>
          <Text style={styles.defLabel}>Recovery blockers (habits & rhythm)</Text>
          <Text style={[styles.absorptionNoteText, { marginBottom: 6 }]}>
            Not “bad foods” alone — these slow how fast nutrients refill for your case.
          </Text>
          {blockers.map((line, i) => (
            <View key={i} style={[styles.checkRow, { marginBottom: 4 }]} wrap={false}>
              <View style={styles.checkBullet}>
                <Text style={styles.checkMark}>!</Text>
              </View>
              <Text style={styles.checkText}>{line}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  )
}

function MorningRoutineSection({ data }: { data: RecoveryReportV2Data }) {
  return (
    <View>
      <Text style={styles.sectionLabel}>DAILY PLAN</Text>
      <Text style={styles.sectionTitle}>Daily action plan</Text>
      <View style={styles.sectionDivider} />

      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderText, { width: '16%' }]}>TIME</Text>
        <Text style={[styles.tableHeaderText, { width: '40%' }]}>ACTION</Text>
        <Text style={[styles.tableHeaderText, { width: '44%' }]}>WHY (YOUR CASE)</Text>
      </View>
      {data.morningRoutine.map((row, i) => (
        <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]} wrap={false}>
          <Text style={[styles.tableEmphasisEmerald, { width: '16%' }]}>{row.time}</Text>
          <Text style={[styles.tableCellText, { width: '40%' }]}>{row.action}</Text>
          <Text style={[styles.tableCellText, { width: '44%', fontStyle: 'italic', color: COLORS.emeraldDark }]}>
            {row.reason}
          </Text>
        </View>
      ))}
    </View>
  )
}

function MealPlanSection({ data }: { data: RecoveryReportV2Data }) {
  const days = [...data.mealPlan].sort((a, b) => a.day - b.day)
  return (
    <View>
      <Text style={styles.sectionLabel}>NUTRITION</Text>
      <Text style={styles.sectionTitle}>7-day meal plan</Text>
      <Text style={styles.sectionSubtitle}>
        Indian-forward plates with explicit deficiency targets per slot.
      </Text>
      <View style={styles.sectionDivider} />

      <SafeImage
        src={MEAL_PLAN_BANNER}
        style={[styles.sectionBannerWide, styles.mealPlanBannerImg, { objectFit: 'cover', height: 64 }]}
      />

      {days.map((d, di) => (
        <View key={di} wrap={false}>
          <View style={[styles.mealDayHeaderBox, { paddingVertical: 6 }]}>
            <View style={styles.mealDayTexts}>
              <Text style={[styles.mealDayHeaderText, { fontSize: 9 }]}>DAY {d.day}</Text>
              <Text style={[styles.mealDayFocus, { fontSize: 7.5 }]}>Focus: {d.focus}</Text>
            </View>
            <SafeImage
              src={dayFoodImages[d.day - 1] || dayFoodImages[0]}
              style={[styles.mealDayThumb, { objectFit: 'cover', width: 32, height: 32, borderRadius: 16 }]}
            />
          </View>
          <View style={[styles.tableHeader, styles.mealPlanCompactHeader]}>
            <Text style={[styles.tableHeaderText, { width: '24%' }]}>TIMING</Text>
            <Text style={[styles.tableHeaderText, { width: '48%' }]}>FOOD</Text>
            <Text style={[styles.tableHeaderText, { width: '28%' }]}>TARGET</Text>
          </View>
          {d.meals.map((m, mi) => (
            <View
              key={mi}
              style={[styles.tableRow, styles.mealPlanCompactRow, mi % 2 === 1 ? styles.tableRowAlt : {}]}
              wrap={false}
            >
              <Text style={[styles.tableCellText, { width: '24%', fontSize: 7.5, color: COLORS.gray500 }]}>
                {m.timing}
              </Text>
              <Text style={[styles.tableCellText, { width: '48%', fontSize: 8.5, fontWeight: 700 }]}>{m.food}</Text>
              <Text style={[styles.tableCellText, { width: '28%', fontSize: 8, color: COLORS.emerald, fontWeight: 700 }]}>
                {m.deficiencyTarget}
              </Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  )
}

function SupplementsSection({ data }: { data: RecoveryReportV2Data }) {
  return (
    <View>
      <Text style={styles.sectionLabel}>SUPPLEMENTS</Text>
      <Text style={styles.sectionTitle}>Supplement protocol</Text>
      <View style={styles.sectionDivider} />

      <SafeImage
        src={SUPPLEMENT_SECTION_BANNER}
        style={[styles.sectionBannerWide, styles.supplementBannerImg, { objectFit: 'cover' }]}
      />

      {data.supplements.map((sup, i) => (
        <View key={i} style={styles.suppCard} wrap={false}>
          <View style={styles.supplementCardHeaderRow}>
            <View style={styles.suppTitleBlock}>
              <Text style={styles.suppName}>{sup.name}</Text>
            </View>
            <SafeImage src={getSupplementImageUrl(sup.name)} style={[styles.supplementThumbCircular, { objectFit: 'cover' }]} />
          </View>
          <View style={styles.suppStatPillWrap}>
            {[
              ['Dosage', sup.dosage],
              ['When', sup.when],
              ['With food / empty', sup.takeWithFood],
              ['Absorption pair', sup.absorptionPair],
              ['Duration', sup.duration],
              ['Brand', sup.brand],
            ].map(([k, v], j) =>
              v ? (
                <View key={j} style={styles.suppStat}>
                  <Text style={styles.suppStatLabel}>{k}</Text>
                  <Text style={styles.suppStatVal}>{v}</Text>
                </View>
              ) : null,
            )}
          </View>
          {sup.whyThisForm ? (
            <>
              <Text style={styles.suppParaLabel}>Why this form</Text>
              <Text style={styles.defBody}>{sup.whyThisForm}</Text>
            </>
          ) : null}
          {sup.howItWorks ? (
            <>
              <Text style={styles.suppParaLabel}>How it works in your body</Text>
              <Text style={styles.defBody}>{sup.howItWorks}</Text>
            </>
          ) : null}
          {sup.expectedResults ? (
            <>
              <Text style={styles.suppParaLabel}>What you may notice</Text>
              <Text style={[styles.defBody, { color: COLORS.emeraldDark, fontStyle: 'italic' }]}>
                {sup.expectedResults}
              </Text>
            </>
          ) : null}
          {sup.foodAlternatives.length > 0 ? (
            <>
              <Text style={styles.suppParaLabel}>Food-first alternatives</Text>
              <Text style={styles.defBody}>{sup.foodAlternatives.join(' · ')}</Text>
            </>
          ) : null}
          {sup.safetyNote ? <Text style={styles.suppSafety}>{sup.safetyNote}</Text> : null}
        </View>
      ))}
    </View>
  )
}

function FoodsAvoidSection({ data }: { data: RecoveryReportV2Data }) {
  return (
    <View>
      <Text style={styles.sectionLabel}>BLOCKERS</Text>
      <Text style={styles.sectionTitle}>Foods blocking recovery</Text>
      <View style={styles.sectionDivider} />

      <View style={styles.foodsSplitRow}>
        <View style={[styles.foodsSplitCol, { marginRight: 8 }]}>
          <SafeImage src={FOODS_AVOID_JUNK} style={[styles.foodsSplitAvoidImg, { objectFit: 'cover' }]} />
          <Text style={styles.foodsSplitLabelAvoid}>AVOID THESE</Text>
        </View>
        <View style={styles.foodsSplitMiddle}>
          <Text style={styles.foodsSplitArrow}>{'\u2192'}</Text>
        </View>
        <View style={[styles.foodsSplitCol, { marginLeft: 8 }]}>
          <SafeImage src={FOODS_EAT_FRESH} style={[styles.foodsSplitEatImg, { objectFit: 'cover' }]} />
          <Text style={styles.foodsSplitLabelEat}>EAT THESE INSTEAD</Text>
        </View>
      </View>

      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderText, { width: '22%' }]}>AVOID</Text>
        <Text style={[styles.tableHeaderText, { width: '46%' }]}>WHY IT HURTS YOU</Text>
        <Text style={[styles.tableHeaderText, { width: '32%' }]}>SWAP</Text>
      </View>
      {data.foodsToAvoid.map((f, i) => (
        <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]} wrap={false}>
          <Text style={[styles.avoidFood, { width: '22%' }]}>{f.food}</Text>
          <Text style={[styles.avoidWhy, { width: '46%' }]}>{f.whyHurting}</Text>
          <Text style={[styles.avoidSwap, { width: '32%' }]}>{f.swapWith}</Text>
        </View>
      ))}
    </View>
  )
}

function GutHealthSection({ data }: { data: RecoveryReportV2Data }) {
  const g = data.gutHealth
  const pairs = g.nutrientPairs
  const foods = g.probioticFoods.slice(0, 4)
  const gridRows = [foods.slice(0, 2), foods.slice(2, 4)]
  return (
    <View>
      <Text style={styles.sectionLabel}>GUT HEALTH & ABSORPTION</Text>
      <Text style={styles.sectionTitle}>Are You Actually Absorbing What You Eat?</Text>
      <View style={styles.sectionDivider} />

      <View style={styles.absorptionScoreRow}>
        <AbsorptionScoreRing score={g.absorptionScore} />
        <View style={styles.absorptionScoreTextCol}>
          <Text style={styles.absorptionLabel}>Your Absorption Efficiency</Text>
          <Text style={styles.absorptionNoteText}>{g.absorptionNote}</Text>
        </View>
      </View>

      {g.gutIssues.length > 0 ? (
        <View style={styles.gutIssuesList}>
          <Text style={styles.defLabel}>Signals from your answers</Text>
          {g.gutIssues.slice(0, 4).map((line, i) => (
            <Text key={i} style={styles.gutIssueLine}>
              • {line}
            </Text>
          ))}
        </View>
      ) : null}

      <Text style={styles.nutrientPairTableTitle}>Smart Nutrient Pairs — Take These Together</Text>
      <Text style={styles.nutrientPairTableSub}>
        How you combine nutrients matters as much as which ones you take
      </Text>
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderText, { width: '32%' }]}>PAIR</Text>
        <Text style={[styles.tableHeaderText, { width: '8%', textAlign: 'center' }]}> </Text>
        <Text style={[styles.tableHeaderText, { width: '60%' }]}>WHY IT WORKS</Text>
      </View>
      {pairs.map((p, i) => (
        <View key={i} style={[styles.nutrientPairRow, i % 2 === 1 ? styles.tableRowAlt : {}]} wrap={false}>
          <Text style={styles.nutrientPairName}>{p.pair}</Text>
          <Text style={styles.nutrientPairPlus}>+</Text>
          <Text style={styles.nutrientPairWhy}>{p.why}</Text>
        </View>
      ))}

      <Text style={styles.probioticGridTitle}>Gut-Healing Foods for YOUR Diet</Text>
      {gridRows.map((row, ri) => (
        <View key={ri} style={styles.probioticGridRow}>
          {row.map((line, ci) => {
            const { title, qty } = splitFoodQuantity(line)
            return (
              <View key={ci} style={styles.probioticCard}>
                <View style={styles.probioticCircle} />
                <Text style={styles.probioticName}>{title}</Text>
                {qty ? <Text style={styles.probioticQty}>{qty}</Text> : null}
              </View>
            )
          })}
        </View>
      ))}

      {g.absorptionTips.map((t, i) => (
        <View key={i} style={styles.absorptionTipCard} wrap={false}>
          <View style={styles.tipNumCircle}>
            <Text style={styles.tipNumText}>{i + 1}</Text>
          </View>
          <View style={styles.tipTextCol}>
            <Text style={styles.tipBold}>{t.tip}</Text>
            <Text style={styles.tipReason}>{t.reason}</Text>
          </View>
        </View>
      ))}
    </View>
  )
}

function SleepStressSection({ data }: { data: RecoveryReportV2Data }) {
  const ss = data.sleepStress
  return (
    <View>
      <Text style={styles.sectionLabel}>SLEEP & STRESS PROTOCOL</Text>
      <Text style={styles.sectionTitle}>How Stress is Draining Your Nutrients</Text>
      <View style={styles.sectionDivider} />

      <Text style={[styles.absorptionNoteText, { marginBottom: 8 }]}>
        Sleep score · {Math.round(ss.sleepScore)}/100 — tied to how well your reported rhythm supports repletion.
      </Text>

      <View style={styles.stressImpactCard} wrap={false}>
        <Text style={styles.stressImpactText}>{ss.stressImpact}</Text>
        {ss.stressNutrients.map((row, i) => (
          <View key={i} style={[styles.stressNutrientRow, { flexDirection: 'row', alignItems: 'flex-start' }]} wrap={false}>
            <Text style={styles.warnIcon}>⚠</Text>
            <View style={{ flexGrow: 1 }}>
              <Text style={[styles.stressNutrientName, { width: 'auto', marginBottom: 2 }]}>{row.nutrient}</Text>
              <Text style={[styles.stressNutrientWhy, { width: 'auto' }]}>{row.why}</Text>
            </View>
          </View>
        ))}
      </View>

      <Text style={[styles.defLabel, { marginTop: 6 }]}>Evening rhythm</Text>
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderText, { width: '16%' }]}>TIME</Text>
        <Text style={[styles.tableHeaderText, { width: '38%' }]}>ACTION</Text>
        <Text style={[styles.tableHeaderText, { width: '46%' }]}>WHY IT HELPS YOUR RECOVERY</Text>
      </View>
      {ss.eveningRoutine.map((row, i) => (
        <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]} wrap={false}>
          <Text style={[styles.tableEmphasisEmerald, { width: '16%' }]}>{row.time}</Text>
          <Text style={[styles.tableCellText, { width: '38%' }]}>{row.action}</Text>
          <Text style={[styles.tableCellText, { width: '46%', fontStyle: 'italic', color: COLORS.emeraldDark }]}>
            {row.reason}
          </Text>
        </View>
      ))}

      <View style={styles.breathingCard} wrap={false}>
        <Text style={styles.breathingTitle}>2-Minute Reset Technique</Text>
        <Text style={styles.breathingBody}>{ss.breathingExercise}</Text>
        <View style={styles.breathingRow}>
          <View style={styles.breathingSquare}>
            <Text style={styles.breathingNum}>4</Text>
            <Text style={styles.breathingLbl}>INHALE 4s</Text>
          </View>
          <View style={styles.breathingSquare}>
            <Text style={styles.breathingNum}>7</Text>
            <Text style={styles.breathingLbl}>HOLD 7s</Text>
          </View>
          <View style={styles.breathingSquare}>
            <Text style={styles.breathingNum}>8</Text>
            <Text style={styles.breathingLbl}>EXHALE 8s</Text>
          </View>
        </View>
      </View>

      <View style={styles.weekendTipCard} wrap={false}>
        <Text style={styles.weekendTipText}>{ss.weekendTip}</Text>
      </View>
    </View>
  )
}

function LabTestsSection({ data }: { data: RecoveryReportV2Data }) {
  return (
    <View>
      <Text style={styles.sectionLabel}>LAB TESTS</Text>
      <Text style={styles.sectionTitle}>Know Your Numbers — Test Don&apos;t Guess</Text>
      <View style={styles.sectionDivider} />
      <Text style={styles.labIntro}>
        These are the exact blood tests that will confirm your deficiencies and track your progress. Get them done before
        starting this protocol, then retest at 3 months.
      </Text>

      {data.labTests.map((lab, i) => {
        const tone = estimateLevelTone(lab.theirEstimatedLevel)
        const estColor =
          tone === 'red' ? COLORS.red : tone === 'amber' ? COLORS.amber : COLORS.emeraldDark
        return (
          <View key={i} style={styles.labCard} wrap={false}>
            <View style={styles.labCardTop}>
              <Text style={styles.labTestTitle}>{lab.testName}</Text>
              <View style={styles.labCostPill}>
                <Text style={styles.labCostPillText}>{lab.cost}</Text>
              </View>
            </View>
            <Text style={styles.labWhy}>{lab.whyNeeded}</Text>
            <View style={styles.labMiniRow}>
              <View style={styles.labMiniCol}>
                <Text style={styles.labMiniLbl}>Normal range</Text>
                <Text style={styles.labMiniVal}>{lab.normalRange}</Text>
              </View>
              <View style={styles.labMiniCol}>
                <Text style={styles.labMiniLbl}>Your est. level</Text>
                <Text style={[styles.labMiniVal, { color: estColor }]}>{lab.theirEstimatedLevel}</Text>
              </View>
              <View style={[styles.labMiniCol, { marginRight: 0 }]}>
                <Text style={styles.labMiniLbl}>When to get</Text>
                <Text style={styles.labMiniVal}>{lab.whenToGet}</Text>
              </View>
            </View>
            <Text style={styles.labWhere}>Where to get: {lab.whereToGet}</Text>
            <Text style={styles.labCta}>Get this test →</Text>
          </View>
        )
      })}

      <View style={styles.labNoteCard} wrap={false}>
        <Text style={styles.labNoteText}>
          Once you receive your results, share them with hi@thebeetamin.com and our nutritionist will update your
          supplement dosages accordingly — included in your plan.
        </Text>
      </View>
    </View>
  )
}

function chunkPairs<T>(arr: T[]): T[][] {
  const rows: T[][] = []
  for (let i = 0; i < arr.length; i += 2) rows.push(arr.slice(i, i + 2))
  return rows
}

function ShoppingListSection({ data }: { data: RecoveryReportV2Data }) {
  const sl: ShoppingListV2 = data.shoppingList
  const shopRows = chunkPairs(sl.supplementProducts)
  return (
    <View>
      <Text style={styles.sectionLabel}>SHOPPING LIST</Text>
      <Text style={styles.sectionTitle}>Everything You Need — In One Place</Text>
      <View style={styles.sectionDivider} />

      <View style={styles.shopSummaryRow}>
        <View style={styles.shopPillGreen}>
          <Text style={styles.shopPillTitle}>Weekly groceries (add)</Text>
          <Text style={styles.shopPillVal}>{sl.totalWeeklyGroceryAdd}</Text>
        </View>
        <View style={styles.shopPillBlue}>
          <Text style={styles.shopPillTitle}>Monthly supplements</Text>
          <Text style={styles.shopPillVal}>{sl.totalSupplementCost}</Text>
        </View>
      </View>

      <Text style={styles.nutrientPairTableTitle}>Add These to Your Weekly Shopping</Text>
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderText, { width: '22%' }]}>ITEM</Text>
        <Text style={[styles.tableHeaderText, { width: '18%' }]}>QTY</Text>
        <Text style={[styles.tableHeaderText, { width: '22%' }]}>TARGETS</Text>
        <Text style={[styles.tableHeaderText, { width: '22%' }]}>WHERE</Text>
        <Text style={[styles.tableHeaderText, { width: '16%' }]}>EST.</Text>
      </View>
      {sl.weeklyEssentials.map((w, i) => (
        <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]} wrap={false}>
          <Text style={[styles.tableCellText, { width: '22%', fontWeight: 700 }]}>{w.item}</Text>
          <Text style={[styles.tableCellText, { width: '18%', fontSize: 8 }]}>{w.quantity}</Text>
          <View style={{ width: '22%', paddingRight: 4 }}>
            <View style={styles.defTargetPill}>
              <Text style={styles.defTargetPillText}>{w.deficiencyTarget}</Text>
            </View>
          </View>
          <Text style={[styles.tableCellText, { width: '22%', fontSize: 8 }]}>{w.whereToBuy}</Text>
          <Text style={[styles.tableCellText, { width: '16%', fontSize: 8 }]}>{w.cost}</Text>
        </View>
      ))}

      <Text style={[styles.probioticGridTitle, { marginTop: 10 }]}>Supplements to Order This Week</Text>
      <View style={styles.supplementShopGrid}>
        {shopRows.map((pair, ri) => (
          <View key={ri} style={{ flexDirection: 'row', width: '100%', marginBottom: 6 }}>
            {pair.map((p, ci) => (
              <View key={ci} style={[styles.supplementShopCard, { flex: 1 }, ci === 0 ? { marginRight: 6 } : {}]}>
                <Text style={styles.supShopName}>{p.name}</Text>
                <Text style={styles.supShopBrand}>{p.brand}</Text>
                <Text style={styles.supShopLine}>Monthly need: {p.monthlyQuantity}</Text>
                <Text style={styles.supShopLine}>Cost: {p.cost}</Text>
                <Text style={styles.supShopLink}>Order from: {p.link}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>

      <View style={styles.budgetTipCard}>
        <Text style={styles.budgetTipText}>{sl.budgetTip}</Text>
      </View>
    </View>
  )
}

function TimelineSection({ data }: { data: RecoveryReportV2Data }) {
  return (
    <View>
      <Text style={styles.sectionLabel}>TIMELINE</Text>
      <Text style={styles.sectionTitle}>90-day timeline</Text>
      <View style={styles.sectionDivider} />

      <SafeImage src={TIMELINE_BANNER} style={[styles.sectionBannerWide, styles.timelineBannerImg, { objectFit: 'cover' }]} />

      {data.timeline.map((t, i) => (
        <View key={i} wrap={false}>
          <View style={styles.timelineRow}>
            <View style={styles.timelineLeft}>
              <Text style={styles.timelinePeriod}>{t.period}</Text>
              <Text style={styles.timelinePhase}>{t.phase}</Text>
            </View>
            <View style={styles.timelineContent}>
              {t.changes.map((c, j) => (
                <View key={j} style={styles.checkRow}>
                  <View style={styles.checkBullet}>
                    <Text style={styles.checkMark}>✓</Text>
                  </View>
                  <Text style={styles.checkText}>{c}</Text>
                </View>
              ))}
            </View>
          </View>
          {i < data.timeline.length - 1 ? <Text style={styles.timelineArrow}>↓</Text> : null}
        </View>
      ))}
    </View>
  )
}

function InsightsSection({ data }: { data: RecoveryReportV2Data }) {
  return (
    <View>
      <Text style={styles.sectionLabel}>INSIGHTS</Text>
      <Text style={styles.sectionTitle}>Smart insights</Text>
      <View style={styles.sectionDivider} />

      {data.progressPrediction ? (
        <View style={[styles.stressImpactCard, { marginBottom: 10 }]} wrap={false}>
          <Text style={[styles.defLabel, { marginBottom: 4 }]}>If you stay consistent</Text>
          <Text style={styles.stressImpactText}>{data.progressPrediction}</Text>
        </View>
      ) : null}

      {data.lifestyleInsights.map((line, i) => (
        <View key={i} style={styles.insightCard} wrap={false}>
          <View style={styles.insightSvg}>
            <Svg width={12} height={12} viewBox="0 0 12 12">
              <Path d="M6 0 L12 6 L6 12 L0 6 Z" fill={COLORS.emerald} />
            </Svg>
          </View>
          <Text style={styles.insightText}>{line}</Text>
        </View>
      ))}
    </View>
  )
}

function FinalSection({ data }: { data: RecoveryReportV2Data }) {
  const issues = data.top3Issues.slice(0, 3)
  const actions = data.top3Actions.slice(0, 3)
  return (
    <View>
      <Text style={styles.sectionLabel}>CLOSE</Text>
      <Text style={styles.sectionTitle}>Final summary</Text>
      <View style={styles.sectionDivider} />

      <Text style={styles.defLabel}>Top issues to respect</Text>
      {issues.map((t, i) => (
        <View key={i} style={styles.summaryRow} wrap={false}>
          <Text style={styles.summaryNum}>{i + 1}</Text>
          <Text style={styles.summaryText}>{t}</Text>
        </View>
      ))}

      <Text style={[styles.defLabel, { marginTop: 10 }]}>Top actions starting today</Text>
      {actions.map((t, i) => (
        <View key={i} style={styles.checkRow} wrap={false}>
          <View style={styles.checkBullet}>
            <Text style={styles.checkMark}>✓</Text>
          </View>
          <Text style={styles.checkText}>{t}</Text>
        </View>
      ))}

      <View style={styles.doctorCard} wrap={false}>
        <Text style={styles.doctorNote}>{data.doctorNote}</Text>
        <View style={styles.doctorSigRow}>
          <SafeImage src={DOCTOR_AVATAR} style={[styles.doctorAvatar, { objectFit: 'cover' }]} />
          <View>
            <Text style={styles.doctorSigName}>Dr. Priya Sharma</Text>
            <Text style={styles.doctorSigLine}>Clinical Nutritionist | M.Sc Nutrition & Dietetics</Text>
            <Text style={styles.doctorSigLine}>Reg. No. NUT-2847 · The Beetamin Wellness Clinic</Text>
          </View>
        </View>
      </View>

      <Text style={styles.smallFootnote}>
        Report ID {data.reportId ?? '—'} · {formatReportDate(data.generatedAt)} · thebeetamin.com
      </Text>
    </View>
  )
}

function QuickWinsStrip({ data }: { data: RecoveryReportV2Data }) {
  return (
    <View style={{ marginTop: 8 }} wrap={false}>
      <Text style={styles.defLabel}>Quick wins (first 72 hours)</Text>
      {data.quickWins.map((q, i) => (
        <View key={i} style={styles.checkRow}>
          <View style={styles.checkBullet}>
            <Text style={styles.checkMark}>✓</Text>
          </View>
          <Text style={styles.checkText}>{q}</Text>
        </View>
      ))}
    </View>
  )
}

/** Premium A4 portrait recovery report built with react-pdf (server-side render). */
export function RecoveryReportPDF({ reportData }: { reportData: RecoveryReportV2Data }) {
  const name = reportData.name?.trim() || 'Valued patient'
  const rid = reportData.reportId ?? '—'
  const prepared = formatReportDate(reportData.generatedAt)
  const defCount = reportData.primaryDeficiencies.length

  return (
    <Document title={`TheBeetamin Recovery — ${name}`} author="TheBeetamin" subject="Recovery report">
      <Page size="A4" style={styles.coverPage}>
        <View style={styles.coverTopBar} />
        <View style={styles.coverBodyRelative}>
          <SafeImage
            src={COVER_IMAGE_HERO}
            style={[styles.coverHeroDeco, { objectFit: 'cover' }]}
          />
          <SafeImage
            src={COVER_IMAGE_BOTTOM_LEFT}
            style={[styles.coverBottomLeftDeco, { objectFit: 'cover' }]}
          />
          <View style={styles.coverContent}>
            <View style={styles.coverBrandRow}>
              <LeafBrandSvg size={20} />
              <Text style={styles.coverBrandText}>TheBeetamin</Text>
            </View>
            <View style={styles.coverBadge}>
              <Text style={styles.coverBadgeText}>PERSONALISED DEFICIENCY RECOVERY</Text>
            </View>
            <Text style={styles.coverTitle}>Your Recovery</Text>
            <Text style={styles.coverAccent}>Blueprint.</Text>
            <View style={styles.coverDivider} />
            <Text style={styles.coverPreparedFor}>Prepared exclusively for</Text>
            <Text style={styles.coverName}>{name}</Text>
            <View style={styles.coverMetaBox}>
              <Text style={styles.coverMetaText}>Report ID · {rid}</Text>
              <Text style={styles.coverMetaText}>{prepared}</Text>
              <Text style={styles.coverMetaText}>Prepared by Dr. Priya Sharma</Text>
              {reportData.goal ? <Text style={styles.coverMetaText}>Goal focus · {reportData.goal}</Text> : null}
            </View>
          </View>
        </View>
        <View style={styles.coverStatsRow}>
          <View style={styles.coverStatItem}>
            <Text style={styles.coverStatNum}>{reportData.healthScore}</Text>
            <Text style={styles.coverStatLabel}>HEALTH SCORE</Text>
          </View>
          <View style={styles.coverStatItem}>
            <Text style={styles.coverStatNum}>{defCount}</Text>
            <Text style={styles.coverStatLabel}>DEFICIENCIES FOUND</Text>
          </View>
          <View style={styles.coverStatItem}>
            <Text style={styles.coverStatNum}>{TOTAL_PAGES_LABEL}</Text>
            <Text style={styles.coverStatLabel}>PAGES</Text>
          </View>
          <View style={styles.coverStatItem}>
            <Text style={styles.coverStatNumAccent}>₹0</Text>
            <Text style={styles.coverStatLabel}>EXTRA COST</Text>
          </View>
        </View>
        <View style={styles.coverBottom}>
          <Text style={styles.coverDisclaimer}>{STANDARD_DISCLAIMER}</Text>
        </View>
      </Page>

      <ReportInteriorPage patientName={name} reportId={rid}>
        <View>
          <HealthScoreSection data={reportData} />
          <QuickWinsStrip data={reportData} />
        </View>
      </ReportInteriorPage>

      <ReportInteriorPage patientName={name} reportId={rid}>
        <DeficienciesSection data={reportData} />
        <SymptomMapAndBlockersSection data={reportData} />
      </ReportInteriorPage>

      <ReportInteriorPage patientName={name} reportId={rid}>
        <MorningRoutineSection data={reportData} />
      </ReportInteriorPage>

      <ReportInteriorPage patientName={name} reportId={rid}>
        <MealPlanSection data={reportData} />
      </ReportInteriorPage>

      <ReportInteriorPage patientName={name} reportId={rid}>
        <SupplementsSection data={reportData} />
      </ReportInteriorPage>

      <ReportInteriorPage patientName={name} reportId={rid}>
        <FoodsAvoidSection data={reportData} />
      </ReportInteriorPage>

      <ReportInteriorPage patientName={name} reportId={rid}>
        <GutHealthSection data={reportData} />
      </ReportInteriorPage>

      <ReportInteriorPage patientName={name} reportId={rid}>
        <SleepStressSection data={reportData} />
      </ReportInteriorPage>

      <ReportInteriorPage patientName={name} reportId={rid}>
        <LabTestsSection data={reportData} />
      </ReportInteriorPage>

      <ReportInteriorPage patientName={name} reportId={rid}>
        <ShoppingListSection data={reportData} />
      </ReportInteriorPage>

      <ReportInteriorPage patientName={name} reportId={rid}>
        <TimelineSection data={reportData} />
      </ReportInteriorPage>

      <ReportInteriorPage patientName={name} reportId={rid}>
        <InsightsSection data={reportData} />
      </ReportInteriorPage>

      <ReportInteriorPage patientName={name} reportId={rid}>
        <FinalSection data={reportData} />
      </ReportInteriorPage>
    </Document>
  )
}
