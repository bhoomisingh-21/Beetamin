import Image from 'next/image'
import { MessageCircle } from 'lucide-react'

import { SITE_FAQS } from '@/lib/faq-content'

import { FAQAccordionItem, FAQAccordionProvider } from './FAQAccordion'

export default function FAQ() {
  return (
    <section id="faq" className="overflow-x-hidden bg-[#F6F3EC] px-4 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="relative pb-8">
          <div className="relative overflow-hidden rounded-[2rem] shadow-[0_24px_60px_rgba(28,26,22,0.14)]">
            <Image
              src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=900"
              alt="Nutritionist on a video consultation helping with a personalised Indian diet plan"
              width={900}
              height={1100}
              className="h-[280px] w-full object-cover sm:h-[380px] lg:h-[560px]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1A2E24]/80 via-transparent to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
              <p className="font-serif text-2xl italic text-white sm:text-3xl">
                Still unsure? Ask us anything.
              </p>
              <p className="mt-2 max-w-sm text-sm text-white/85">
                Nutritionists reply on WhatsApp. Most questions are answered within a day.
              </p>
            </div>
          </div>

          <div className="absolute -bottom-5 right-4 flex items-center gap-3 rounded-2xl border border-[#E4DFD4] bg-white px-4 py-3 shadow-[0_12px_32px_rgba(28,26,22,0.12)] sm:right-8">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#25D366] text-white">
              <MessageCircle size={18} fill="currentColor" />
            </span>
            <div>
              <p className="text-sm font-semibold text-[#111111]">WhatsApp support</p>
              <p className="text-xs text-[#333333]">Included with every plan</p>
            </div>
          </div>
        </div>

        <div className="pt-6 lg:pt-0">
          <span className="mb-4 inline-flex rounded-full border border-[#2A5340]/20 bg-white px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#2A5340]">
            FAQ
          </span>
          <h2 className="font-serif text-3xl font-medium leading-tight text-[#111111] sm:text-4xl md:text-5xl">
            Common <span className="italic text-[#2A5340]">questions</span>
          </h2>
          <p className="mt-3 mb-8 max-w-md text-sm text-[#333333] sm:text-base">
            Everything you need to know before you start. Still stuck?{' '}
            <a
              href="mailto:hi@thebeetamin.com"
              className="font-medium text-[#2A5340] hover:underline"
            >
              Email us
            </a>
          </p>

          <FAQAccordionProvider>
            {SITE_FAQS.map((faq, i) => (
              <FAQAccordionItem key={faq.q} index={i} question={faq.q}>
                <p className="px-4 pb-4 text-sm leading-relaxed text-[#333333] sm:px-5 sm:pb-5">
                  {faq.a}
                </p>
              </FAQAccordionItem>
            ))}
          </FAQAccordionProvider>
        </div>
      </div>
    </section>
  )
}
