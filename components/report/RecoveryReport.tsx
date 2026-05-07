import React from 'react'
import { Document, Page, Text, View, Svg, Path, Image } from '@react-pdf/renderer'
import type { Style } from '@react-pdf/types'
import type { RecoveryReportV2Data, RecoverySubScoresV2 } from '@/lib/recovery-report-v2-types'
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
      <Text style={styles.sectionTitle}>Health score</Text>
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
      <View style={styles.blockSpacer} />
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

function MorningRoutineSection({ data }: { data: RecoveryReportV2Data }) {
  return (
    <View>
      <View style={styles.blockSpacer} />
      <Text style={styles.sectionLabel}>PROTOCOL</Text>
      <Text style={styles.sectionTitle}>Morning rhythm</Text>
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
      <View style={styles.blockSpacer} />
      <Text style={styles.sectionLabel}>NUTRITION</Text>
      <Text style={styles.sectionTitle}>7-day meal map</Text>
      <Text style={styles.sectionSubtitle}>
        Indian-forward plates with explicit deficiency targets per slot.
      </Text>
      <View style={styles.sectionDivider} />

      <SafeImage
        src={MEAL_PLAN_BANNER}
        style={[styles.sectionBannerWide, styles.mealPlanBannerImg, { objectFit: 'cover' }]}
      />

      {days.map((d, di) => (
        <View key={di} wrap={false}>
          <View style={styles.mealDayHeaderBox}>
            <View style={styles.mealDayTexts}>
              <Text style={styles.mealDayHeaderText}>DAY {d.day}</Text>
              <Text style={styles.mealDayFocus}>Focus: {d.focus}</Text>
            </View>
            <SafeImage
              src={dayFoodImages[d.day - 1] || dayFoodImages[0]}
              style={[styles.mealDayThumb, { objectFit: 'cover' }]}
            />
          </View>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { width: '24%' }]}>TIMING</Text>
            <Text style={[styles.tableHeaderText, { width: '48%' }]}>FOOD</Text>
            <Text style={[styles.tableHeaderText, { width: '28%' }]}>TARGET</Text>
          </View>
          {d.meals.map((m, mi) => (
            <View key={mi} style={[styles.tableRow, mi % 2 === 1 ? styles.tableRowAlt : {}]} wrap={false}>
              <Text style={[styles.tableCellText, { width: '24%', fontSize: 8.5, color: COLORS.gray500 }]}>
                {m.timing}
              </Text>
              <Text style={[styles.tableCellText, { width: '48%', fontWeight: 700 }]}>{m.food}</Text>
              <Text
                style={[styles.tableCellText, { width: '28%', fontSize: 8.5, color: COLORS.emerald, fontWeight: 700 }]}
              >
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
      <View style={styles.blockSpacer} />
      <Text style={styles.sectionLabel}>SUPPLEMENTS</Text>
      <Text style={styles.sectionTitle}>Precision stack</Text>
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
            <SafeImage
              src={getSupplementImageUrl(sup.name)}
              style={[styles.supplementThumbCircular, { objectFit: 'cover' }]}
            />
          </View>
          <View style={styles.suppStatPillWrap}>
            {[
              ['Dosage', sup.dosage],
              ['When', sup.when],
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
      <View style={styles.blockSpacer} />
      <Text style={styles.sectionLabel}>BLOCKERS</Text>
      <Text style={styles.sectionTitle}>Foods slowing recovery</Text>
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

function TimelineSection({ data }: { data: RecoveryReportV2Data }) {
  return (
    <View>
      <View style={styles.blockSpacer} />
      <Text style={styles.sectionLabel}>TIMELINE</Text>
      <Text style={styles.sectionTitle}>90-day arc</Text>
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
      <View style={styles.blockSpacer} />
      <Text style={styles.sectionLabel}>INSIGHTS</Text>
      <Text style={styles.sectionTitle}>Personalised signals</Text>
      <View style={styles.sectionDivider} />

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
      <View style={styles.blockSpacer} />
      <Text style={styles.sectionLabel}>CLOSE</Text>
      <Text style={styles.sectionTitle}>Your summary</Text>
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

      <Text style={styles.smallFootnote}>{STANDARD_DISCLAIMER}</Text>
      <Text style={[styles.smallFootnote, { marginTop: 4 }]}>
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
  const qwCount = reportData.quickWins.length

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
            <Text style={styles.coverStatLabel}>FOCUS AREAS</Text>
          </View>
          <View style={styles.coverStatItem}>
            <Text style={styles.coverStatNum}>{qwCount}</Text>
            <Text style={styles.coverStatLabel}>QUICK WINS</Text>
          </View>
        </View>
        <View style={styles.coverBottom}>
          <Text style={styles.coverDisclaimer}>{STANDARD_DISCLAIMER}</Text>
        </View>
      </Page>

      <Page size="A4" style={styles.page} wrap>
        <View style={styles.topAccentBar} fixed />
        <View style={styles.pageHeader} fixed>
          <View style={styles.pageHeaderBrandWrap}>
            <LeafBrandSvg size={14} />
            <Text style={styles.headerBrand}>TheBeetamin · Recovery Blueprint</Text>
          </View>
          <Text style={styles.headerMeta}>{rid}</Text>
        </View>

        <View style={styles.content}>
          <HealthScoreSection data={reportData} />
          <QuickWinsStrip data={reportData} />
          <DeficienciesSection data={reportData} />
          <MorningRoutineSection data={reportData} />
          <MealPlanSection data={reportData} />
          <SupplementsSection data={reportData} />
          <FoodsAvoidSection data={reportData} />
          <TimelineSection data={reportData} />
          <InsightsSection data={reportData} />
          <FinalSection data={reportData} />
        </View>

        <View style={styles.pageFooterFixed} fixed>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) =>
              `${name} · thebeetamin.com   ·   Page ${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  )
}
