/** Shared Tailwind fragments for the nutritionist portal light green/white theme. */
export const portal = {
  pageBg: 'bg-[#f4faf7]',
  backBtn:
    'inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-emerald-400 hover:text-emerald-800',
  heading: 'text-2xl font-black tracking-tight text-slate-900',
  subtext: 'mt-1 text-sm text-slate-500',
  accentBar: 'mt-3 h-[3px] w-10 rounded-full bg-emerald-500',
  card: 'rounded-2xl border border-emerald-100 bg-white shadow-sm',
  cardMuted: 'rounded-xl border border-emerald-100 bg-emerald-50/40',
  cardEmpty: 'rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/30 px-6 py-14 text-center',
  divider: 'border-emerald-100',
  input:
    'w-full rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100',
  inputSearch:
    'w-full rounded-xl border border-emerald-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100',
  tabActive: 'bg-emerald-600 text-white shadow-sm',
  tabIdle:
    'border border-emerald-100 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800',
  clientNavActive: 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200',
  clientNavIdle: 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-800',
  toast:
    'fixed bottom-6 left-1/2 z-[110] max-w-md -translate-x-1/2 rounded-xl border border-emerald-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-xl',
  navHeader: 'sticky top-0 z-40 border-b border-emerald-100 bg-white/95 backdrop-blur-md',
  navLink:
    'flex min-h-[48px] items-center gap-3 rounded-xl px-4 py-3 text-base font-semibold text-slate-700 transition hover:bg-emerald-50',
  navMobile: 'absolute inset-y-0 left-0 flex w-[min(100%,18rem)] flex-col border-r border-emerald-800 bg-emerald-800 shadow-2xl',
  overlay: 'absolute inset-0 bg-black/40 backdrop-blur-sm',
  sidebar:
    'hidden md:flex md:w-[88px] lg:w-[104px] shrink-0 flex-col border-r border-emerald-800 bg-gradient-to-b from-emerald-800 to-emerald-900',
  sidebarLink:
    'flex flex-col items-center justify-center gap-1.5 rounded-xl px-2 py-3 text-[10px] font-semibold leading-tight transition lg:px-3 lg:text-[11px]',
  sidebarLinkActive: 'bg-white/15 text-white ring-1 ring-white/20',
  sidebarLinkIdle: 'text-emerald-100/80 hover:bg-white/10 hover:text-white',
  clientHeader: 'sticky top-0 z-30 border-b border-emerald-200 bg-[#eef8f3] shadow-sm',
  textH: 'text-slate-900',
  textBody: 'text-slate-700',
  textMuted: 'text-slate-500',
  textAccent: 'text-emerald-700',
  btnPrimary:
    'rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:opacity-50',
  btnOutline:
    'rounded-xl border border-emerald-400 px-4 py-2.5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50',
  btnGhost:
    'rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-emerald-300 hover:text-emerald-800',
  modal:
    'w-full max-w-lg rounded-2xl border border-emerald-100 bg-white p-6 shadow-2xl',
  modalOverlay: 'fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm',
  gridHeader: 'border-b border-emerald-200 bg-emerald-50/60',
  gridBorder: 'border-emerald-100',
  gridAccent: 'text-emerald-900',
  gridCell: 'border-emerald-200 bg-white hover:border-emerald-400',
  gridCellEmpty: 'border-emerald-100 bg-emerald-50/50 text-slate-400 hover:border-emerald-300',
  gridMacroBox: 'border-emerald-200 bg-emerald-50/80',
} as const
