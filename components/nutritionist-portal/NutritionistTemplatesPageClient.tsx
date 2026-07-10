'use client'

import { useMemo, useState, useTransition } from 'react'
import { BookOpen, Loader2, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { deleteNutritionistTemplate } from '@/lib/template-actions'
import { TEMPLATE_CONDITION_TAGS, type TemplateListItem } from '@/lib/template-types'
import { portal } from '@/components/nutritionist-portal/portal-theme'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function tagLabel(tag: string) {
  return tag.replace(/_/g, ' ')
}

export default function NutritionistTemplatesPageClient({
  templates,
}: {
  templates: TemplateListItem[]
}) {
  const router = useRouter()
  const [filter, setFilter] = useState<string>('all')
  const [pending, startTransition] = useTransition()

  const filtered = useMemo(() => {
    if (filter === 'all') return templates
    return templates.filter((t) => t.condition_tags.includes(filter))
  }, [templates, filter])

  function handleDelete(id: string, name: string) {
    if (!confirm(`Delete template "${name}"?`)) return
    startTransition(async () => {
      await deleteNutritionistTemplate(id)
      router.refresh()
    })
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className={portal.heading}>Meal templates</h1>
        <p className={portal.subtext}>
          Reusable diet plans — apply from a client&apos;s meal plan builder or manage here
        </p>
        <div className={portal.accentBar} aria-hidden />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`rounded-full px-4 py-2 text-xs font-bold transition ${
            filter === 'all' ? portal.tabActive : portal.tabIdle
          }`}
        >
          All
        </button>
        {TEMPLATE_CONDITION_TAGS.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => setFilter(tag)}
            className={`rounded-full px-4 py-2 text-xs font-bold capitalize transition ${
              filter === tag ? portal.tabActive : portal.tabIdle
            }`}
          >
            {tagLabel(tag)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className={portal.cardEmpty}>
          <BookOpen className="mx-auto mb-3 text-emerald-400" size={32} />
          <p className={`font-semibold ${portal.textH}`}>No templates yet</p>
          <p className={`mt-2 text-sm ${portal.textMuted}`}>
            Open a client meal plan, add foods to the grid, then click &quot;Save as Template&quot;.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => (
            <div key={t.id} className={`${portal.card} flex flex-col gap-3 p-5`}>
              <div>
                <h3 className="font-bold text-slate-900">{t.name}</h3>
                <p className={`mt-1 text-xs ${portal.textMuted}`}>
                  {t.entry_count} items · {formatDate(t.created_at)}
                  {t.target_kcal ? ` · ${t.target_kcal} kcal target` : ''}
                </p>
              </div>
              <div className="flex flex-wrap gap-1">
                {t.condition_tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold capitalize text-emerald-800"
                  >
                    {tagLabel(tag)}
                  </span>
                ))}
              </div>
              <button
                type="button"
                disabled={pending}
                onClick={() => handleDelete(t.id, t.name)}
                className="mt-auto flex items-center gap-1 self-start text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
              >
                {pending ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
