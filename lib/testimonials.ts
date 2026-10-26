export type ChatLine = {
  from: 'customer' | 'beetamin'
  text: string
  time: string
}

export type Testimonial = {
  id: string
  channel: 'whatsapp' | 'instagram' | 'google'
  displayName: string
  handle?: string
  timeLabel: string
  photoSrc?: string
  quote?: string
  messages?: ChatLine[]
  rating?: 1 | 2 | 3 | 4 | 5
  location?: string
  reviewerCount?: string
}

export const WHATSAPP_CHAT: Testimonial = {
  id: 'whatsapp-ananya',
  channel: 'whatsapp',
  displayName: 'Ananya Sharma',
  timeLabel: 'online',
  photoSrc:
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&q=80&fit=crop&crop=faces',
  messages: [
    {
      from: 'customer',
      text: 'Heyy! Just wanted to say I really loved my diet plan from thebeetamin 🤗',
      time: '3:05 PM',
    },
    {
      from: 'customer',
      text: "It's so well planned and easy to follow. Finally someone who actually understands our Indian food habits 😍",
      time: '3:06 PM',
    },
    {
      from: 'beetamin',
      text: "So glad to hear that! How's it going with the plan? Any changes you can already feel? 😊",
      time: '3:12 PM',
    },
    {
      from: 'customer',
      text: 'Yes! I feel more energetic and my cravings have reduced a lot. Also, the portion guide and meal options are super helpful. 🙌',
      time: '3:18 PM',
    },
    {
      from: 'customer',
      text: 'Definitely worth it!',
      time: '3:18 PM',
    },
    {
      from: 'beetamin',
      text: "That's so great to hear! Keep going 💚",
      time: '3:20 PM',
    },
  ],
}

export const INSTAGRAM_CHAT: Testimonial = {
  id: 'instagram-neha',
  channel: 'instagram',
  displayName: 'Neha',
  handle: 'neha.m_',
  timeLabel: 'Active now',
  photoSrc:
    'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=120&q=80&fit=crop&crop=faces',
  messages: [
    {
      from: 'beetamin',
      text: "hey, just checking in — how's this week going with the plan?",
      time: '11:40 am',
    },
    {
      from: 'customer',
      text: 'hey! honestly better than last month',
      time: '12:02 pm',
    },
    {
      from: 'beetamin',
      text: 'good to hear. still getting that 4pm crash?',
      time: '12:04 pm',
    },
    {
      from: 'customer',
      text: 'some days but not like before. the soaked almonds thing is actually helping lol',
      time: '12:11 pm',
    },
    {
      from: 'beetamin',
      text: 'keep that going. we can tweak portions in the next session if you want',
      time: '12:13 pm',
    },
    {
      from: 'customer',
      text: 'yes please. this has been way easier than i thought',
      time: '12:16 pm',
    },
  ],
}

export const GOOGLE_REVIEWS: Testimonial[] = [
  {
    id: 'google-priya',
    channel: 'google',
    displayName: 'Priya Kulkarni',
    timeLabel: '2 weeks ago',
    location: 'Pune',
    rating: 5,
    reviewerCount: '9 reviews',
    quote:
      'Was not sure this would be different from other diet pages. They actually planned around dal, roti, curd. Feeling less tired after 3 weeks. Nutritionist replies on WhatsApp, which helped.',
  },
  {
    id: 'google-rohan',
    channel: 'google',
    displayName: 'Rohan Mehta',
    timeLabel: 'a month ago',
    location: 'Mumbai',
    rating: 4,
    reviewerCount: '4 reviews',
    quote:
      "Assessment took 2 minutes. First slot took a bit of time to get but once the sessions started it was solid. Meal plan is realistic, not some foreign diet I can't cook at home.",
  },
]
