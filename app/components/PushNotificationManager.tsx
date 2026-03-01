"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { X } from "lucide-react"  

export function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstallButton, setShowInstallButton] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false) 

  useEffect(() => {
    // Check if previously dismissed
    const dismissed = localStorage.getItem("installPromptDismissed")
    if (dismissed === "true") {
      setIsDismissed(true)
      return
    }

    setIsIOS(
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
        !(window as any).MSStream
    )

    setIsStandalone(
      window.matchMedia("(display-mode: standalone)").matches
    )

    window.addEventListener("beforeinstallprompt", (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallButton(true)
    })

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setShowInstallButton(false)
    }
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === "accepted") {
        setShowInstallButton(false)
      }
      setDeferredPrompt(null)
    } else if (isIOS) {
      alert(
        'To install on iOS:\n\n1. Tap the share button\n2. Scroll down and tap "Add to Home Screen"\n3. Tap "Add"'
      )
    }
  }

  const handleClose = () => {
    setIsDismissed(true)
    localStorage.setItem("installPromptDismissed", "true") // 👈 persist
  }

  if (isStandalone || isDismissed) return null
  if (!showInstallButton && !isIOS) return null

  return (
    <div className="relative bg-gradient-to-r from-[#C29307] to-[#d4a414] rounded-lg p-4 max-w-sm text-white shadow-lg">
      
      {/* 🔥 Close Button */}
      <button
        onClick={handleClose}
        className="absolute top-2 right-2 text-white/80 hover:text-white transition"
        aria-label="Close"
      >
        <X size={18} />
      </button>

      <div className="flex items-start space-x-3">
        <Image
          src="/logo.png"
          alt="Zidwell Logo"
          width={40}
          height={40}
          className="w-10 h-10 object-contain border-2 border-[#C29307] shadow-[4px_4px_0px_#111827] bg-black p-1"
        />

        <div className="flex-1">
          <h3 className="font-semibold mb-1">Install Zidwell App</h3>
          <p className="text-sm text-white/90 mb-3">
            {isIOS
              ? "Install on your iPhone/iPad for the best experience"
              : "Get the best experience with our app - install it on your device!"}
          </p>

          <button
            onClick={handleInstallClick}
            className="w-full px-4 py-2 bg-white text-[#C29307] text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isIOS ? "Show iOS Instructions" : "Install Now"}
          </button>
        </div>
      </div>
    </div>
  )
}