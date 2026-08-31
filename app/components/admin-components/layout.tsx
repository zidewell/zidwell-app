// app/components/admin-components/layout.tsx
'use client'

import React, { useEffect, useState } from 'react'
import AdminSidebar from '@/app/components/admin-components/AdminSideBar'
import { ThemeProvider } from 'next-themes'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <div className="min-h-screen bg-[var(--bg-primary)] transition-colors duration-300">
        <AdminSidebar />
        <div className="lg:ml-64">
          <main className="p-4 md:p-6 min-h-[calc(100vh-4rem)]">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ThemeProvider>
  )
}