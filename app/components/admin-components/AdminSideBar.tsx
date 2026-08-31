// app/components/admin-components/AdminSideBar.tsx
'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import {
  LayoutDashboard,
  Users,
  Wallet,
  FileText,
  FileSignature,
  Receipt,
  LogOut,
  Menu,
  X,
  Moon,
  Sun,
  TrendingUp,
  Shield,
} from 'lucide-react'

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/wallets', label: 'Wallets', icon: Wallet },
  { href: '/admin/transactions', label: 'Transactions', icon: TrendingUp },
  { href: '/admin/invoices', label: 'Invoices', icon: FileText },
  { href: '/admin/receipts', label: 'Receipts', icon: Receipt },
  { href: '/admin/kyc', label: 'KYC', icon: Shield },
  { href: '/admin/admins', label: 'Admins', icon: Users },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleSidebar = () => setIsOpen(!isOpen)
  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark')

  if (!mounted) return null

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] shadow-lg hover:shadow-xl transition-all duration-200"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 z-40
          bg-[var(--bg-card)] border-r border-[var(--border)]
          transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          shadow-2xl
        `}
      >
        {/* Brand */}
        <div className="relative flex items-center gap-3 p-5 border-b border-[var(--border)]">
          <div className="relative">
            <div className="absolute inset-0 rounded-xl bg-[var(--color-amber)] blur-xl opacity-20 animate-pulse" />
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-amber)] to-[var(--color-amber-dark)] flex items-center justify-center text-[var(--color-ink)] font-bold text-xl shadow-lg shadow-[var(--color-amber)]/20">
              Z
            </div>
          </div>
          <div>
            <h1 className="font-[var(--font-space-grotesk)] text-xl font-bold tracking-tight bg-gradient-to-r from-[var(--color-amber)] to-[var(--color-amber-dark)] bg-clip-text text-transparent">
              Zidwell
            </h1>
            <p className="text-xs text-[var(--text-muted)] font-medium tracking-wider uppercase">Admin Panel</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`
                  group flex items-center gap-3 px-4 py-3 rounded-xl
                  transition-all duration-300 ease-out
                  ${isActive
                    ? 'bg-gradient-to-r from-[var(--color-amber)]/20 to-[var(--color-amber)]/5 text-[var(--color-amber)] font-semibold shadow-inner'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] hover:translate-x-1'
                  }
                `}
              >
                <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className="text-sm font-medium">{item.label}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--color-amber)] shadow-glow" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[var(--border)] space-y-2 bg-gradient-to-t from-[var(--bg-card)] to-transparent">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-all duration-300 group"
          >
            <div className="relative w-5 h-5">
              <Sun className={`absolute inset-0 w-5 h-5 transition-all duration-500 ${theme === 'dark' ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}`} />
              <Moon className={`absolute inset-0 w-5 h-5 transition-all duration-500 ${theme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'}`} />
            </div>
            <span className="text-sm font-medium group-hover:translate-x-0.5 transition-transform">
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </span>
          </button>

          {/* Logout */}
          <button
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-[var(--text-secondary)] hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 transition-all duration-300 group"
          >
            <LogOut className="w-5 h-5 transition-transform group-hover:rotate-12" />
            <span className="text-sm font-medium group-hover:translate-x-0.5 transition-transform">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 lg:hidden animate-fade-in"
          onClick={toggleSidebar}
        />
      )}
    </>
  )
}