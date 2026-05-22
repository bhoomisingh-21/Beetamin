import { ImageResponse } from 'next/og'
import { BeetaminIconMark } from '@/components/brand/BeetaminIconMark'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(<BeetaminIconMark boxSize={180} />, size)
}
