// app/components/admin-components/AdminHeader.tsx
'use client'
import React from 'react'
import NotificationBell from '../NotificationBell'
import { Input } from '../ui/input'

export default function AdminTopbar() {
  return (
    <header className="w-full border-b border-[var(--border-color)] bg-[var(--bg-primary)] p-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-medium font-[var(--font-space-grotesk)] text-[var(--text-primary)]">
          Admin Dashboard
        </h1>
      </div>
      <div className="flex items-center gap-3">
        <Input 
          placeholder="Search..." 
          className="border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-[var(--color-accent-yellow)] focus:border-[var(--color-accent-yellow)] w-32 md:w-48"
          style={{ outline: "none", boxShadow: "none" }}
        />
        <div className="rounded-full bg-[var(--color-accent-yellow)] w-8 h-8 flex items-center justify-center text-[var(--color-ink)] font-semibold text-sm">
          AL
        </div>
      </div>
      <NotificationBell />
    </header>
  )
}