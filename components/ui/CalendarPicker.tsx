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
    <div className="bg-white border border-gray-200 rounded-2xl p-4 w-full max-w-sm mx-auto shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={prevMonth}
          className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-500 hover:text-gray-900"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-gray-900 font-bold text-sm">
          {MONTHS[month]} {year}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-500 hover:text-gray-900"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-2">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-gray-500 text-xs font-medium py-1">
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
                ${sel ? 'bg-emerald-500 text-white font-bold shadow-sm' : ''}
                ${!sel && tod ? 'border border-emerald-500 text-emerald-700 font-medium' : ''}
                ${!sel && !tod && !disabled ? 'text-gray-800 hover:bg-emerald-50' : ''}
                ${disabled ? 'text-gray-300 cursor-not-allowed' : ''}
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
