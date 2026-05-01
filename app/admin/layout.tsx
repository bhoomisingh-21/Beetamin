'use client'

import { AdminPanelLayout } from '@/components/admin/AdminPanelLayout'

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <AdminPanelLayout>{children}</AdminPanelLayout>
}
