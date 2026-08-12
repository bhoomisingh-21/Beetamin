'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { ChevronDown } from 'lucide-react'

type FAQAccordionContextValue = {
  open: number | null
  toggle: (index: number) => void
}

const FAQAccordionContext = createContext<FAQAccordionContextValue | null>(null)

function useFAQAccordion() {
  const ctx = useContext(FAQAccordionContext)
  if (!ctx) {
    throw new Error('FAQAccordionItem must be used within FAQAccordionProvider')
  }
  return ctx
}

type ProviderProps = {
  children: ReactNode
  defaultOpen?: number | null
}

export function FAQAccordionProvider({ children, defaultOpen = 0 }: ProviderProps) {
  const [open, setOpen] = useState<number | null>(defaultOpen)

  const toggle = useCallback((index: number) => {
    setOpen((current) => (current === index ? null : index))
  }, [])

  const value = useMemo(() => ({ open, toggle }), [open, toggle])

  return (
    <FAQAccordionContext.Provider value={value}>
      <div className="space-y-3">{children}</div>
    </FAQAccordionContext.Provider>
  )
}

type ItemProps = {
  index: number
  question: string
  children: ReactNode
}

/** Answer `children` are server-rendered — always present in the initial HTML. */
export function FAQAccordionItem({ index, question, children }: ItemProps) {
  const { open, toggle } = useFAQAccordion()
  const isOpen = open === index

  return (
    <div
      className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-sm transition cursor-pointer"
      onClick={() => toggle(index)}
    >
      <div className="p-4 sm:p-5 flex justify-between items-start gap-3 sm:gap-4">
        <p className="text-gray-900 font-semibold text-sm sm:text-base leading-snug text-center lg:text-left w-full">
          {question}
        </p>
        <ChevronDown
          size={17}
          className={`text-gray-400 transition-transform duration-300 shrink-0 mt-0.5 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </div>

      <div
        className={`grid transition-[grid-template-rows,opacity] duration-250 ease-in-out ${
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
        aria-hidden={!isOpen}
      >
        <div className="overflow-hidden">{children}</div>
      </div>
    </div>
  )
}
