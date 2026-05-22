import { ImageResponse } from 'next/og'
import { BeetaminIconMark } from '@/components/brand/BeetaminIconMark'

export const size = { width: 48, height: 48 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(<BeetaminIconMark boxSize={48} />, size)
}
