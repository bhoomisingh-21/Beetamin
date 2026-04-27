'use client'

import { RadialBar, RadialBarChart, ResponsiveContainer } from 'recharts'

type Props = {
  score: number
  fill: string
}

/** Semi-circular score gauge — score 0–100 */
export function DeficiencyScoreGauge({ score, fill }: Props) {
  const clamped = Math.max(0, Math.min(100, score))
  const data = [{ name: 'score', value: clamped, fill }]

  return (
    <div className="relative mx-auto aspect-[4/3] w-full max-w-[240px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="75%"
          innerRadius="55%"
          outerRadius="95%"
          barSize={14}
          data={data}
          startAngle={180}
          endAngle={0}
        >
          <RadialBar
            background={{ fill: 'rgba(255,255,255,0.06)' }}
            dataKey="value"
            cornerRadius={8}
            fill={fill}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-end pb-[8%] text-center">
        <span className="text-4xl font-black tabular-nums text-[#F0F4F8]" style={{ textShadow: `0 0 24px ${fill}44` }}>
          {clamped}
        </span>
        <span className="text-sm font-semibold text-[#8B9AB0]">/ 100</span>
      </div>
    </div>
  )
}
