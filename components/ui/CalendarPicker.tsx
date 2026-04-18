'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type Props = {
  selected: Date | null
  onSelect: (date: Date) => void
  availableDays?: number[] // 0=Sun...6=Sat; if undefined, all days shown
  minDate?: Date
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export default function CalendarPicker({
  selected,
  onSelect,
  availableDays,
  minDate,
}: Props) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date()
    d.setDate(1)
    d.setHours(0, 0, 0, 0)
    return d
  })

  const min = minDate ?? today

  function prevMonth() {
    setViewMonth((m) => {
      const d = new Date(m)
      d.setMonth(d.getMonth() - 1)
      return d
    })
  }

  function nextMonth() {
    setViewMonth((m) => {
      const d = new Date(m)
      d.setMonth(d.getMonth() + 1)
      return d
    })
  }

  const year = viewMonth.getFullYear()
  const month = viewMonth.getMonth()
  const firstDow = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  function isDisabled(day: number) {
    const d = new Date(year, month, day)
    if (d < min) return true
    if (availableDays && !availableDays.includes(d.getDay())) return true
    return false
  }

  function isSelected(day: number) {
    if (!selected) return false
    return (
      selected.getFullYear() === year &&
      selected.getMonth() === month &&
      selected.getDate() === day
    )
  }

  function isToday(day: number) {
    return (
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === day
    )
  }

  return (
    <div className="bg-[#111820] border border-white/[0.08] rounded-2xl p-4 w-full max-w-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={prevMonth}
          className="p-2 rounded-lg hover:bg-white/5 transition text-gray-400 hover:text-white"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-white font-bold text-sm">
          {MONTHS[month]} {year}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="p-2 rounded-lg hover:bg-white/5 transition text-gray-400 hover:text-white"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-2">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-gray-600 text-xs font-medium py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Date grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={idx} />
          const disabled = isDisabled(day)
          const sel = isSelected(day)
          const tod = isToday(day)

          return (
            <button
              key={idx}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(new Date(year, month, day))}
              className={`
                relative mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm transition
                ${sel ? 'bg-emerald-500 text-black font-bold' : ''}
                ${!sel && tod ? 'border border-emerald-500/50 text-emerald-400' : ''}
                ${!sel && !tod && !disabled ? 'text-gray-300 hover:bg-white/10' : ''}
                ${disabled ? 'text-gray-700 cursor-not-allowed' : ''}
              `}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}
