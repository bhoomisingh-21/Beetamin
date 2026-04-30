'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'
import {
  Eye,
  Loader2,
  Pencil,
  Pin,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import type { NutritionistNoteDTO } from '@/lib/nutritionist-portal-actions'
import {
  createNutritionistNote,
  deleteNutritionistNote,
  toggleNutritionistNotePin,
  updateNutritionistNote,
} from '@/lib/nutritionist-portal-actions'
import { tagColorClass } from '@/components/nutritionist-portal/tag-hash'

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

type Props = {
  clientId: string
  clientEmail: string
  sessionsTotal: number
  notes: NutritionistNoteDTO[]
  tagFilter: string | null
  onTagFilter: (t: string | null) => void
  initialSessionFilter?: string
}

export function NutritionistNotesTab({
  clientId,
  clientEmail,
  sessionsTotal,
  notes,
  tagFilter,
  onTagFilter,
  initialSessionFilter = 'all',
}: Props) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [sessionFilter, setSessionFilter] = useState(initialSessionFilter)
  const [editing, setEditing] = useState<NutritionistNoteDTO | null>(null)

  const [draftContent, setDraftContent] = useState('')
  const [draftSession, setDraftSession] = useState<string>('general')
  const [draftTags, setDraftTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [draftVisible, setDraftVisible] = useState(false)
  const [draftPin, setDraftPin] = useState(false)

  function openCreate() {
    setEditing(null)
    setDraftContent('')
    setDraftSession('general')
    setDraftTags([])
    setDraftVisible(false)
    setDraftPin(false)
    setShowForm(true)
  }

  function openEdit(n: NutritionistNoteDTO) {
    setEditing(n)
    setDraftContent(n.content)
    setDraftSession(n.session_number == null ? 'general' : String(n.session_number))
    setDraftTags([...n.tags])
    setDraftVisible(n.is_visible_to_client)
    setDraftPin(n.is_pinned)
    setShowForm(true)
  }

  function addTagFromInput() {
    const t = tagInput.trim()
    if (!t) return
    if (!draftTags.includes(t)) setDraftTags([...draftTags, t])
    setTagInput('')
  }

  function saveNote() {
    const sessionNum =
      draftSession === 'general' ? null : Number(draftSession)
    start(async () => {
      if (editing) {
        const res = await updateNutritionistNote({
          noteId: editing.id,
          clientId,
          clientEmail,
          content: draftContent,
          sessionNumber: Number.isFinite(sessionNum as number) ? sessionNum : null,
          tags: draftTags,
          isVisibleToClient: draftVisible,
          isPinned: draftPin,
        })
        if (res.ok) {
          setShowForm(false)
          setEditing(null)
          router.refresh()
        }
      } else {
        const res = await createNutritionistNote({
          clientId,
          clientEmail,
          content: draftContent,
          sessionNumber: Number.isFinite(sessionNum as number) ? sessionNum : null,
          tags: draftTags,
          isVisibleToClient: draftVisible,
          isPinned: draftPin,
        })
        if (res.ok) {
          setShowForm(false)
          router.refresh()
        }
      }
    })
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return notes.filter((n) => {
      if (tagFilter && !n.tags.includes(tagFilter)) return false
      if (sessionFilter !== 'all') {
        if (sessionFilter === 'general') {
          if (n.session_number != null) return false
        } else if (String(n.session_number) !== sessionFilter) return false
      }
      if (!q) return true
      if (n.content.toLowerCase().includes(q)) return true
      return n.tags.some((t) => t.toLowerCase().includes(q))
    })
  }, [notes, search, sessionFilter, tagFilter])

  const sessionOptions = useMemo(() => {
    const max = Math.max(6, sessionsTotal || 6)
    return Array.from({ length: max }, (_, i) => i + 1)
  }, [sessionsTotal])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-black hover:bg-emerald-400"
        >
          <Plus size={18} />
          Add note
        </button>
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes…"
            className="w-full rounded-xl border border-white/[0.08] bg-[#060910] px-4 py-2.5 text-sm text-[#F0F4F8] outline-none ring-emerald-500/15 focus:ring-2 sm:max-w-xs"
          />
          <select
            value={sessionFilter}
            onChange={(e) => setSessionFilter(e.target.value)}
            className="rounded-xl border border-white/[0.08] bg-[#060910] px-4 py-2.5 text-sm text-[#F0F4F8]"
          >
            <option value="all">All sessions</option>
            <option value="general">General</option>
            {sessionOptions.map((n) => (
              <option key={n} value={String(n)}>
                Session {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
          <div className="mt-8 w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#0F1623] p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-black text-[#F0F4F8]">
                {editing ? 'Edit note' : 'New note'}
              </h3>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg p-2 text-[#8B9AB0] hover:bg-white/5 hover:text-[#F0F4F8]"
              >
                <X size={18} />
              </button>
            </div>
            <textarea
              value={draftContent}
              onChange={(e) => setDraftContent(e.target.value)}
              placeholder="Write your clinical note…"
              rows={8}
              className="w-full rounded-xl border border-white/[0.08] bg-[#060910] px-4 py-3 text-sm text-[#F0F4F8] outline-none ring-emerald-500/15 focus:ring-2"
            />
            <label className="mt-4 block text-xs font-semibold text-[#8B9AB0]">Session</label>
            <select
              value={draftSession}
              onChange={(e) => setDraftSession(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/[0.08] bg-[#060910] px-4 py-2.5 text-sm text-[#F0F4F8]"
            >
              <option value="general">General</option>
              {sessionOptions.map((n) => (
                <option key={n} value={String(n)}>
                  Session {n}
                </option>
              ))}
            </select>

            <label className="mt-4 block text-xs font-semibold text-[#8B9AB0]">Tags</label>
            <div className="mt-1 flex flex-wrap gap-2">
              {draftTags.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setDraftTags(draftTags.filter((x) => x !== t))}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${tagColorClass(t)}`}
                >
                  {t} ✕
                </button>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTagFromInput()
                  }
                }}
                placeholder="Type tag + Enter"
                className="flex-1 rounded-xl border border-white/[0.08] bg-[#060910] px-3 py-2 text-sm text-[#F0F4F8]"
              />
            </div>

            <div className="mt-4 flex flex-col gap-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-[#F0F4F8]">
                <input
                  type="checkbox"
                  checked={draftVisible}
                  onChange={(e) => setDraftVisible(e.target.checked)}
                />
                Visible to client (otherwise private)
              </label>
              <p className="text-[11px] text-[#8B9AB0]">
                Clients see shared notes in their profile when enabled.
              </p>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-[#F0F4F8]">
                <input type="checkbox" checked={draftPin} onChange={(e) => setDraftPin(e.target.checked)} />
                Pin as quick reminder
              </label>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                disabled={pending || !draftContent.trim()}
                onClick={() => saveNote()}
                className="flex-1 rounded-xl bg-emerald-500 py-3 text-sm font-bold text-black hover:bg-emerald-400 disabled:opacity-40"
              >
                {pending ? <Loader2 className="mx-auto animate-spin" size={18} /> : editing ? 'Update note' : 'Save note'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-[#8B9AB0]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <ul className="space-y-4">
        {filtered.map((n) => (
          <NoteCard
            key={n.id}
            note={n}
            pending={pending}
            onEdit={() => openEdit(n)}
            onDelete={() => {
              if (!confirm('Delete this note? This cannot be undone.')) return
              start(async () => {
                await deleteNutritionistNote(n.id, clientId)
                router.refresh()
              })
            }}
            onTogglePin={() => {
              start(async () => {
                await toggleNutritionistNotePin(n.id, clientId, clientEmail)
                router.refresh()
              })
            }}
            onTagClick={(t) => onTagFilter(tagFilter === t ? null : t)}
          />
        ))}
      </ul>
      {filtered.length === 0 && (
        <p className="text-center text-sm text-[#8B9AB0]">No notes match your filters.</p>
      )}
    </div>
  )
}

function NoteCard({
  note,
  pending,
  onEdit,
  onDelete,
  onTogglePin,
  onTagClick,
}: {
  note: NutritionistNoteDTO
  pending: boolean
  onEdit: () => void
  onDelete: () => void
  onTogglePin: () => void
  onTagClick: (t: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const long = note.content.length > 280 || note.content.split('\n').length > 4

  return (
    <li className="group relative rounded-2xl border border-white/[0.06] bg-[#0F1623] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.35)]">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
              note.session_number == null
                ? 'border border-white/10 bg-white/5 text-[#8B9AB0]'
                : 'border border-blue-500/35 bg-blue-500/10 text-blue-300'
            }`}
          >
            {note.session_number == null ? 'General' : `Session ${note.session_number}`}
          </span>
          <span className="text-[11px] text-[#8B9AB0]">{formatWhen(note.created_at)}</span>
        </div>
        <div className="flex items-center gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
          <button
            type="button"
            disabled={pending}
            onClick={onTogglePin}
            className="rounded-lg p-2 text-amber-400 hover:bg-white/5"
            title="Toggle pin"
          >
            <Pin size={16} fill={note.is_pinned ? 'currentColor' : 'none'} />
          </button>
          <button type="button" onClick={onEdit} className="rounded-lg p-2 text-[#8B9AB0] hover:bg-white/5 hover:text-[#F0F4F8]">
            <Pencil size={16} />
          </button>
          <button type="button" onClick={onDelete} className="rounded-lg p-2 text-red-400 hover:bg-red-500/10">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className={`mt-3 text-sm leading-relaxed text-[#F0F4F8] ${!expanded && long ? 'line-clamp-4' : ''}`}>
        {note.content}
      </div>
      {long && (
        <button type="button" onClick={() => setExpanded(!expanded)} className="mt-2 text-xs font-bold text-emerald-400">
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}

      {note.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {note.tags.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onTagClick(t)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${tagColorClass(t)}`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {note.is_visible_to_client && (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-400">
            <Eye size={12} />
            Visible to client
          </span>
        )}
        {note.is_pinned && (
          <span className="rounded-full border border-amber-500/35 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold text-amber-400">
            Pinned
          </span>
        )}
      </div>
    </li>
  )
}
