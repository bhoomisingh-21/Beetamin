import { SITE_FAQS } from '@/lib/faq-content'

import { FAQAccordionItem, FAQAccordionProvider } from './FAQAccordion'

export default function FAQ() {
  return (
    <section className="bg-gradient-to-b from-white to-gray-50 py-14 sm:py-16 px-4 sm:px-6 overflow-x-hidden">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-gray-900 font-black text-3xl sm:text-4xl md:text-5xl leading-tight">
            Common <span className="text-[#00E676]">Questions</span>
          </h2>
          <p className="text-gray-500 mt-3 text-sm sm:text-base">
            Everything you need to know about your journey. Still unsure?{' '}
            <a
              href="mailto:hi@thebeetamin.com"
              className="text-emerald-600 hover:underline font-medium"
            >
              Email us
            </a>
          </p>
        </div>

        <FAQAccordionProvider>
          {SITE_FAQS.map((faq, i) => (
            <FAQAccordionItem key={faq.q} index={i} question={faq.q}>
              <p className="px-4 sm:px-5 pb-4 sm:pb-5 text-gray-500 text-sm leading-relaxed">
                {faq.a}
              </p>
            </FAQAccordionItem>
          ))}
        </FAQAccordionProvider>
      </div>
    </section>
  )
}
