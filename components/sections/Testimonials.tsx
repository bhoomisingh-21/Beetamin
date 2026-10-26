'use client'

import Image from 'next/image'
import {
  ArrowLeft,
  Camera,
  CheckCheck,
  ChevronLeft,
  ImageIcon,
  Mic,
  MoreVertical,
  Paperclip,
  Phone,
  Plus,
  Smile,
  Star,
  Sticker,
  ThumbsUp,
  Users,
  Video,
} from 'lucide-react'
import { motion } from 'framer-motion'

import {
  GOOGLE_REVIEWS,
  INSTAGRAM_CHAT,
  WHATSAPP_CHAT,
  type ChatLine,
  type Testimonial,
} from '@/lib/testimonials'

function Avatar({ item, className }: { item: Testimonial; className: string }) {
  if (item.photoSrc) {
    return (
      <Image
        src={item.photoSrc}
        alt=""
        width={40}
        height={40}
        className={`rounded-full object-cover ${className}`}
      />
    )
  }
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-[#C5D4CB] text-sm font-medium text-[#1A2E24] ${className}`}
    >
      {item.displayName.charAt(0)}
    </span>
  )
}

function WhatsAppPhone({ item }: { item: Testimonial }) {
  return (
    <div className="flex h-full min-h-[540px] flex-col overflow-hidden rounded-[1.6rem] bg-[#ECE5DD] shadow-[0_24px_50px_rgba(28,26,22,0.16)] ring-1 ring-black/10">
      <div className="flex items-center justify-between bg-[#008069] px-2 py-2 text-white">
        <div className="flex min-w-0 items-center gap-2">
          <ChevronLeft size={20} />
          <Avatar item={item} className="h-9 w-9" />
          <div className="min-w-0">
            <p className="truncate text-[15px] font-medium leading-tight">{item.displayName}</p>
            <p className="text-[11px] text-white/85">{item.timeLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 pr-1 text-white">
          <Video size={18} />
          <Phone size={16} />
          <MoreVertical size={16} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 px-2.5 py-3">
        {item.messages?.map((line, i) => (
          <ChatBubble key={`${item.id}-${i}`} line={line} channel="whatsapp" />
        ))}
      </div>

      <div className="flex items-center gap-2 bg-[#F0F2F5] px-2 py-2">
        <Smile size={22} className="text-[#54656F]" />
        <div className="flex-1 rounded-full bg-white px-4 py-2 text-[13px] text-[#667781]">
          Type a message
        </div>
        <Paperclip size={20} className="rotate-45 text-[#54656F]" />
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#008069] text-white">
          <Mic size={18} />
        </span>
      </div>
    </div>
  )
}

function InstagramPhone({ item }: { item: Testimonial }) {
  return (
    <div className="flex h-full min-h-[540px] flex-col overflow-hidden rounded-[1.6rem] bg-[#F2F2F2] shadow-[0_24px_50px_rgba(28,26,22,0.16)] ring-1 ring-black/10">
      <div className="flex items-center justify-between bg-white px-2 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <ArrowLeft size={22} className="shrink-0 text-[#111111]" />
          <Avatar item={item} className="h-9 w-9" />
          <div className="min-w-0">
            <p className="truncate text-[14px] font-semibold leading-tight text-[#111111]">
              {item.displayName}
            </p>
            <p className="truncate text-[11px] leading-tight text-[#737373]">{item.handle}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3 pr-1 text-[#111111]">
          <Users size={18} />
          <Phone size={18} />
          <Video size={18} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 px-3 pt-3">
        <p className="pb-1 text-center text-[11px] text-[#8E8E8E]">Today</p>
        {item.messages?.map((line, i) => (
          <ChatBubble key={`${item.id}-${i}`} line={line} channel="instagram" />
        ))}
      </div>

      <div className="px-2 pb-3 pt-1">
        <div className="flex items-center gap-1.5 rounded-full bg-white px-1.5 py-1 shadow-sm">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#00C853] text-white">
            <Camera size={16} />
          </span>
          <p className="flex-1 text-[14px] text-[#8E8E8E]">Message...</p>
          <Mic size={20} className="shrink-0 text-[#111111]" />
          <ImageIcon size={20} className="shrink-0 text-[#111111]" />
          <Sticker size={20} className="shrink-0 text-[#111111]" />
          <Plus size={20} className="mr-1 shrink-0 text-[#111111]" />
        </div>
      </div>
    </div>
  )
}

function ChatBubble({
  line,
  channel,
}: {
  line: ChatLine
  channel: 'whatsapp' | 'instagram'
}) {
  if (channel === 'whatsapp') {
    const ours = line.from === 'beetamin'
    return (
      <div className={`flex ${ours ? 'justify-end' : 'justify-start'}`}>
        <div
          className={`max-w-[88%] rounded-lg px-2 py-1.5 shadow-sm ${
            ours ? 'rounded-tr-none bg-[#D9FDD3]' : 'rounded-tl-none bg-white'
          }`}
        >
          <p className="text-[13.5px] leading-[1.35] text-[#111B21]">{line.text}</p>
          <p className="mt-0.5 flex items-center justify-end gap-0.5 text-[10px] text-[#667781]">
            {line.time}
            {ours ? <CheckCheck size={13} className="text-[#53BDEB]" /> : null}
          </p>
        </div>
      </div>
    )
  }

  const ours = line.from === 'beetamin'
  return (
    <div className={`flex ${ours ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[88%] rounded-[1.35rem] px-3 py-2 text-[13.5px] leading-snug ${
          ours ? 'bg-[#1C1C1C] text-white' : 'bg-white text-[#111111]'
        }`}
      >
        {line.text}
      </div>
    </div>
  )
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

function GoogleReview({ item }: { item: Testimonial }) {
  const colors = ['bg-[#1A73E8]', 'bg-[#188038]', 'bg-[#F9AB00]', 'bg-[#D93025]']
  const color = colors[item.displayName.charCodeAt(0) % colors.length]

  return (
    <article className="flex flex-1 flex-col border-t border-[#E8EAED] px-4 py-4">
      <div className="flex items-start gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-medium text-white ${color}`}
        >
          {item.displayName.charAt(0)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[#202124]">{item.displayName}</p>
          <p className="text-xs text-[#5F6368]">{item.reviewerCount}</p>
        </div>
        <GoogleMark />
      </div>
      <div className="mt-2 flex items-center gap-2">
        {item.rating ? (
          <div className="flex items-center gap-px" aria-label={`${item.rating} out of 5`}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={14}
                className={i < item.rating! ? 'fill-[#F8BC04] text-[#F8BC04]' : 'text-[#DADCE0]'}
              />
            ))}
          </div>
        ) : null}
        <p className="text-xs text-[#5F6368]">
          {item.timeLabel}
          {item.location ? ` · ${item.location}` : ''}
        </p>
      </div>
      <p className="mt-2 flex-1 text-[13.5px] leading-relaxed text-[#3C4043]">{item.quote}</p>
      <p className="mt-3 flex items-center gap-1 text-xs font-medium text-[#5F6368]">
        <ThumbsUp size={12} />
        Like
      </p>
    </article>
  )
}

function GoogleReviewsPanel() {
  return (
    <div className="flex h-full min-h-[540px] flex-col overflow-hidden rounded-[1.6rem] bg-white shadow-[0_24px_50px_rgba(28,26,22,0.16)] ring-1 ring-black/10">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <GoogleMark />
          <div>
            <p className="text-sm font-medium text-[#202124]">Google reviews</p>
            <p className="text-xs text-[#5F6368]">TheBeetamin</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-medium leading-none text-[#202124]">4.8</p>
          <div className="mt-0.5 flex items-center justify-end gap-px">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={11} className="fill-[#F8BC04] text-[#F8BC04]" />
            ))}
          </div>
          <p className="mt-1 text-[11px] text-[#5F6368]">1,000+ reviews</p>
        </div>
      </div>
      {GOOGLE_REVIEWS.map((item) => (
        <GoogleReview key={item.id} item={item} />
      ))}
    </div>
  )
}

export default function Testimonials() {
  return (
    <section id="testimonials" className="scroll-mt-24 bg-[#F6F3EC] py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-serif text-3xl font-medium tracking-tight text-[#111111] sm:text-4xl md:text-5xl">
            Loved by 1,000+ people{' '}
            <span className="italic text-[#2A5340]">on the programme</span>
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm text-[#333333] sm:text-base">
            Real WhatsApp chats, Instagram DMs, and Google reviews from people using the plan.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 items-stretch gap-6 lg:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
          >
            <WhatsAppPhone item={WHATSAPP_CHAT} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.08 }}
          >
            <InstagramPhone item={INSTAGRAM_CHAT} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.16 }}
          >
            <GoogleReviewsPanel />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
