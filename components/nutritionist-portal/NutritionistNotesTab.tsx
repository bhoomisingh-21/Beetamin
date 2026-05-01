'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import {
  Eye,
  Loader2,
  Pencil,
  Pin,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import type { NutritionistNoteDTO } from '@/lib/nutritionist-types'
import {
  createNutritionistNote,
  deleteNutritionistNote,
  toggleNutritionistNotePin,
  updateNutritionistNote,
} from '@/lib/nutritionist-portal-actions'
import { tagColorClass } from '@/lib/nutritionist-utils'

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

type Props = {
  clientId: string
  clientEmail: string
  clientName: string
  sessionsTotal: number
  notes: NutritionistNoteDTO[]
  tagFilter: string | null
  onTagFilter: (t: string | null) => void
  initialSessionFilter?: string
  defaultNoteSession?: number | null
  /** Increment (e.g. from welcome card) to open the add-note composer. */
  composerKick?: number
}

export function NutritionistNotesTab({
  clientId,
  clientEmail,
  clientName,
  sessionsTotal,
  notes,
  tagFilter,
  onTagFilter,
  initialSessionFilter = 'all',
  defaultNoteSession = null,
  composerKick = 0,
}: Props) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const lastKick = useRef(0)
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
    setDraftSession(
      defaultNoteSession != null && defaultNoteSession >= 1 ? String(defaultNoteSession) : 'general',
    )
    setDraftTags([])
    setDraftVisible(false)
    setDraftPin(false)
    setShowForm(true)
  }

  useEffect(() => {
    if (!composerKick || composerKick === lastKick.current) return
    lastKick.current = composerKick
    openCreate()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- kick signal only; openCreate reads latest defaultNoteSession
  }, [composerKick])

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
    const t = tagInput.trim().replace(/,$/, '')
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

  const sortedFiltered = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [filtered])

  const sessionOptions = useMemo(() => {
    const max = Math.max(6, sessionsTotal || 6)
    return Array.from({ length: max }, (_, i) => i + 1)
  }, [sessionsTotal])

  const emptyAll = notes.length === 0

  return (
    <div className="space-y-0">
      <div className="sticky top-0 z-10 -mx-1 mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] bg-[#060910]/95 px-1 py-3 backdrop-blur-md">
        <p className="text-sm text-[#8B9AB0]">
          <span className="font-bold text-[#F0F4F8]">{notes.length}</span> notes
        </p>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-black hover:bg-emerald-400"
        >
          <Plus size={18} />
          Add Note
        </button>
      </div>

      {!emptyAll && (
        <>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes by content or tag…"
            className="mb-3 w-full rounded-xl border border-white/[0.08] bg-[#060910] px-4 py-2.5 text-sm text-[#F0F4F8] outline-none ring-emerald-500/15 focus:ring-2"
          />
          <select
            value={sessionFilter}
            onChange={(e) => setSessionFilter(e.target.value)}
            className="mb-6 w-full rounded-xl border border-white/[0.08] bg-[#060910] px-4 py-2.5 text-sm text-[#F0F4F8] sm:w-auto"
          >
            <option value="all">All Sessions</option>
            <option value="general">General</option>
            {sessionOptions.map((n) => (
              <option key={n} value={String(n)}>
                Session {n}
              </option>
            ))}
          </select>
        </>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
          <div className="mt-8 w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#0F1623] p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-black text-[#F0F4F8]">{editing ? 'Edit note' : 'New note'}</h3>
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
              rows={6}
              className="max-h-[min(50vh,420px)] min-h-[144px] w-full resize-y rounded-xl border border-white/[0.08] bg-[#060910] px-4 py-3 text-sm text-[#F0F4F8] outline-none ring-emerald-500/15 focus:ring-2"
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
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${tagColorClass(t)}`}
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
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault()
                    addTagFromInput()
                  }
                }}
                placeholder="Tag + Enter or comma"
                className="flex-1 rounded-xl border border-white/[0.08] bg-[#060910] px-3 py-2 text-sm text-[#F0F4F8]"
              />
            </div>

            <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-[#060910] px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#F0F4F8]">
                  {draftVisible ? '👁 Visible to client' : '🔒 Private — only you can see this'}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={draftVisible}
                onClick={() => setDraftVisible(!draftVisible)}
                className={`relative h-7 w-12 shrink-0 rounded-full transition ${draftVisible ? 'bg-emerald-500' : 'bg-[#4B5563]'}`}
              >
                <span
                  className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${draftVisible ? 'left-6' : 'left-1'}`}
                />
              </button>
            </div>

            <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-[#F0F4F8]">
              <input type="checkbox" checked={draftPin} onChange={(e) => setDraftPin(e.target.checked)} />
              📌 Pin as quick reminder
            </label>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl border border-white/15 px-5 py-3 text-sm font-bold text-[#8B9AB0] hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={pending || !draftContent.trim()}
                onClick={() => saveNote()}
                className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-black hover:bg-emerald-400 disabled:opacity-40"
              >
                {pending ? <Loader2 className="mx-auto animate-spin" size={18} /> : editing ? 'Save changes' : 'Save Note'}
              </button>
            </div>
          </div>
        </div>
      )}

      {emptyAll ? (
        <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
          <p className="text-5xl" aria-hidden>
            📝
          </p>
          <h3 className="mt-4 text-lg font-black text-[#F0F4F8]">First session with {clientName}</h3>
          <p className="mt-2 max-w-md text-sm text-[#8B9AB0]">
            Add your initial assessment note to get started.
          </p>
          <button
            type="button"
            onClick={openCreate}
            className="mt-8 rounded-xl bg-emerald-500 px-8 py-3 text-sm font-bold text-black hover:bg-emerald-400"
          >
            Add First Note
          </button>
        </div>
      ) : (
        <ul className="space-y-3">
          {sortedFiltered.map((n) => (
            <NoteCard
              key={n.id}
              note={n}
              pending={pending}
              onEdit={() => openEdit(n)}
              onDelete={() => {
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
      )}

      {!emptyAll && sortedFiltered.length === 0 && (
        <p className="py-10 text-center text-sm text-[#8B9AB0]">No notes match your filters.</p>
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
  const [confirmDel, setConfirmDel] = useState(false)
  const long = note.content.split('\n').length > 5 || note.content.length > 360

  return (
    <li className="group mb-3 rounded-xl border border-white/[0.06] bg-[#0F1623] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.35)]">
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
          <span className="text-xs text-[#8B9AB0]">{formatWhen(note.created_at)}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={pending}
            onClick={onTogglePin}
            className="rounded-lg p-2 text-amber-400 hover:bg-white/5"
            title={note.is_pinned ? 'Unpin' : 'Pin'}
          >
            <Pin size={16} fill={note.is_pinned ? 'currentColor' : 'none'} />
          </button>
          <button type="button" onClick={onEdit} className="rounded-lg p-2 text-[#8B9AB0] hover:bg-white/5 hover:text-[#F0F4F8]">
            <Pencil size={16} />
          </button>
          <button
            type="button"
            onClick={() => setConfirmDel(true)}
            className="rounded-lg p-2 text-[#8B9AB0] hover:bg-red-500/15 hover:text-red-400"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className={`mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[#F0F4F8] ${!expanded && long ? 'line-clamp-5' : ''}`}>
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
              className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${tagColorClass(t)}`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {note.is_visible_to_client && (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
            <Eye size={12} />
            Visible to client
          </span>
        )}
        {note.is_pinned && <span className="text-[11px] font-bold text-amber-400">📌 Pinned</span>}
      </div>

      {confirmDel && (
        <div className="mt-4 rounded-xl border border-red-500/25 bg-red-500/[0.06] p-4">
          <p className="text-sm font-semibold text-[#F0F4F8]">Are you sure? This cannot be undone.</p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setConfirmDel(false)}
              className="rounded-lg border border-white/15 px-4 py-2 text-xs font-bold text-[#8B9AB0]"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setConfirmDel(false)
                onDelete()
              }}
              className="rounded-lg bg-red-500 px-4 py-2 text-xs font-bold text-black hover:bg-red-400 disabled:opacity-40"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </li>
  )
}
