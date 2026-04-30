const PALETTE = [
  'bg-red-500/15 text-red-400 ring-red-500/30',
  'bg-orange-500/15 text-orange-400 ring-orange-500/30',
  'bg-amber-500/15 text-amber-400 ring-amber-500/30',
  'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30',
  'bg-blue-500/15 text-blue-400 ring-blue-500/30',
  'bg-purple-500/15 text-purple-400 ring-purple-500/30',
  'bg-pink-500/15 text-pink-400 ring-pink-500/30',
  'bg-gray-500/15 text-gray-400 ring-gray-500/30',
]

export function tagColorClass(tag: string): string {
  let h = 0
  for (let i = 0; i < tag.length; i++) h = (h + tag.charCodeAt(i) * (i + 1)) % 100000
  return PALETTE[h % PALETTE.length]
}
