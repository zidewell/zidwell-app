// app/components/admin-components/layout.tsx
'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import AdminSidebar from '@/app/components/admin-components/AdminSideBar'
import { ThemeProvider } from 'next-themes'

const ADMIN_SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes for admin sessions
const ADMIN_WARNING_TIME = 5 * 60 * 1000; // 5 minute warning

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    let lastActivity = Date.now()

    const checkSession = () => {
      const now = Date.now()
      if (now - lastActivity >= ADMIN_SESSION_TIMEOUT) {
        // Session expired - clear admin auth and redirect
        localStorage.removeItem('admin_session_data')
        localStorage.removeItem('sb-access-token')
        localStorage.removeItem('sb-refresh-token')
        router.push('/auth/login')
      }
    }

    const handleActivity = () => {
      lastActivity = Date.now()
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
      timerRef.current = setTimeout(checkSession, ADMIN_SESSION_TIMEOUT)
    }

    // Set up activity listeners
    const events = ['mousedown', 'click', 'keydown', 'scroll', 'touchstart', 'mousemove']
    events.forEach(event => window.addEventListener(event, handleActivity, { passive: true }))

    timerRef.current = setTimeout(checkSession, ADMIN_SESSION_TIMEOUT)

    return () => {
      events.forEach(event => window.removeEventListener(event, handleActivity))
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [mounted, router])

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