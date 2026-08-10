/** Shared FAQ copy — homepage accordion, /faq page, and FAQPage JSON-LD stay in sync. */
export type FaqItem = { q: string; a: string }

export const SITE_FAQS: FaqItem[] = [
  {
    q: 'How is Beetamin different from other nutrition apps?',
    a: 'TheBeetamin connects you with certified nutritionists who build plans from your assessment, goals, and medical history — reviewed by a doctor before delivery.',
  },
  {
    q: 'Do I need to do blood tests before starting?',
    a: 'No blood tests required upfront. We start with a comprehensive health assessment and symptom questionnaire. Your nutritionist may recommend specific tests later as part of your protocol.',
  },
  {
    q: 'What happens after I complete the free assessment?',
    a: "You'll receive an instant summary of your likely nutrient gaps. A nutritionist will then reach out within 24 hours to schedule your 1-on-1 consultation call.",
  },
  {
    q: 'Is the ₹3,999 plan a one-time payment or a subscription?',
    a: "It's a one-time payment that covers 3 full months — including all expert sessions, your personalised plan, fortnightly check-ins, and WhatsApp support. No recurring charges.",
  },
  {
    q: 'What is your refund policy?',
    a: "If you're unsatisfied after your first session, contact us at hi@thebeetamin.com within 7 days of purchase for a full refund. No questions asked.",
  },
  {
    q: 'Who exactly will be my nutritionist?',
    a: "After purchase, you'll be matched with one of our certified nutritionists based on your assessment results and health goals. You'll see their full profile — including their specialty, experience, and credentials — before your first session.",
  },
]

/** Extended FAQs shown only on /faq (includes medical disclaimer). */
export const FAQ_PAGE_EXTRA: FaqItem[] = [
  {
    q: 'Is this service a substitute for medical treatment?',
    a: 'No. TheBeetamin is a nutrition guidance platform and is not a substitute for medical diagnosis or treatment. Always consult a qualified doctor for medical conditions.',
  },
]

export const ALL_FAQ_PAGE_ITEMS: FaqItem[] = [...SITE_FAQS, ...FAQ_PAGE_EXTRA]

/** Resource hub topics — scaffold for future MDX articles. */
export const RESOURCE_TOPICS = [
  {
    slug: 'vitamin-d-deficiency-symptoms-india',
    title: 'Vitamin D Deficiency Symptoms in India',
    description: 'Signs, risk factors, and food-first recovery strategies for Indians with low Vitamin D.',
  },
  {
    slug: 'iron-rich-indian-foods',
    title: 'Iron Rich Indian Foods for Deficiency Recovery',
    description: 'Practical iron-rich meals and pairings using everyday Indian kitchen ingredients.',
  },
  {
    slug: 'b12-deficiency-vegetarian-diet',
    title: 'B12 Deficiency & Vegetarian Diet in India',
    description: 'How vegetarians and vegans in India can address B12 gaps through food and targeted support.',
  },
] as const

export type ResourceTopicSlug = (typeof RESOURCE_TOPICS)[number]['slug']

export function getResourceTopic(slug: string) {
  return RESOURCE_TOPICS.find((t) => t.slug === slug)
}
