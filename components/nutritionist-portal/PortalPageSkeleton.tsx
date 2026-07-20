/** Instant loading skeletons shown by app/nutritionist/**\/loading.tsx while server data fetches. */

function Bar({ className = '' }: { className?: string }) {
  return <div className={`rounded-lg bg-emerald-100/80 ${className}`} />
}

function Card({ className = '' }: { className?: string }) {
  return <div className={`rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm ${className}`} />
}

function HeaderSkeleton() {
  return (
    <div>
      <Bar className="h-3 w-24" />
      <Bar className="mt-3 h-8 w-56" />
      <Bar className="mt-2 h-4 w-72" />
    </div>
  )
}

function HomeSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      <HeaderSkeleton />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Card key={i} className="h-24" />
        ))}
      </div>
      <Card className="h-64" />
    </div>
  )
}

function ClientsSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <HeaderSkeleton />
        <Bar className="h-10 w-32" />
      </div>
      <Bar className="h-12 max-w-md" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Card key={i} className="h-40" />
        ))}
      </div>
    </div>
  )
}

function ClientDetailSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="border-b border-emerald-100 bg-[#eef8f3] px-4 py-5 md:px-6">
        <div className="mx-auto flex max-w-6xl items-start gap-4">
          <Bar className="h-9 w-9 rounded-xl" />
          <Bar className="h-14 w-14 rounded-2xl" />
          <div className="flex-1 space-y-2">
            <Bar className="h-6 w-48" />
            <Bar className="h-4 w-32" />
          </div>
        </div>
        <div className="mx-auto mt-4 grid max-w-6xl grid-cols-2 gap-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Bar key={i} className="h-14" />
          ))}
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        <div className="flex gap-2">
          {Array.from({ length: 5 }, (_, i) => (
            <Bar key={i} className="h-10 w-24" />
          ))}
        </div>
        <Card className="mt-6 h-96" />
      </div>
    </div>
  )
}

function ListPageSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      <HeaderSkeleton />
      <div className="space-y-3">
        {Array.from({ length: 5 }, (_, i) => (
          <Card key={i} className="h-20" />
        ))}
      </div>
    </div>
  )
}

const VARIANTS = {
  home: HomeSkeleton,
  clients: ClientsSkeleton,
  clientDetail: ClientDetailSkeleton,
  list: ListPageSkeleton,
} as const

export function PortalPageSkeleton({ variant }: { variant: keyof typeof VARIANTS }) {
  const Variant = VARIANTS[variant]
  return <Variant />
}
