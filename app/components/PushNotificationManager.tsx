'use client'

import { useState, useEffect } from 'react'
import { subscribeUser, unsubscribeUser } from '@/app/action'
import Image from 'next/image'

// Helper function to convert base64 to Uint8Array
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

// // Push Notification Manager Component
// export function PushNotificationManager() {
//   const [isSupported, setIsSupported] = useState(false)
//   const [subscription, setSubscription] = useState<PushSubscription | null>(null)
//   const [isLoading, setIsLoading] = useState(false)
//   const [permission, setPermission] = useState<NotificationPermission>('default')

//   useEffect(() => {
//     if ('serviceWorker' in navigator && 'PushManager' in window) {
//       setIsSupported(true)
//       setPermission(Notification.permission)
//       checkExistingSubscription()
//     }
//   }, [])

//   async function checkExistingSubscription() {
//     try {
//       const registration = await navigator.serviceWorker.ready
//       const sub = await registration.pushManager.getSubscription()
//       setSubscription(sub)
//     } catch (error) {
//       console.error('Error checking subscription:', error)
//     }
//   }

//   async function subscribeToPush() {
//     try {
//       setIsLoading(true)
      
//       // Request permission if not granted
//       if (Notification.permission === 'default') {
//         const permission = await Notification.requestPermission()
//         setPermission(permission)
//         if (permission !== 'granted') {
//           throw new Error('Notification permission denied')
//         }
//       }

//       const registration = await navigator.serviceWorker.ready
      
//       if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
//         throw new Error('VAPID public key not found')
//       }

//       const sub = await registration.pushManager.subscribe({
//         userVisibleOnly: true,
//         applicationServerKey: urlBase64ToUint8Array(
//           process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
//         ),
//       })
      
//       setSubscription(sub)
      
//       const serializedSub = JSON.parse(JSON.stringify(sub))
//       const result = await subscribeUser(serializedSub)
      
//       if (!result.success) {
//         await sub.unsubscribe()
//         setSubscription(null)
//         throw new Error(result.error || 'Failed to subscribe on server')
//       }
      
//       console.log('Successfully subscribed to push notifications')
//     } catch (error) {
//       console.error('Failed to subscribe:', error)
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   async function unsubscribeFromPush() {
//     try {
//       setIsLoading(true)
//       if (subscription) {
//         const endpoint = subscription.endpoint
//         await subscription.unsubscribe()
//         setSubscription(null)
//         await unsubscribeUser(endpoint)
//       }
//     } catch (error) {
//       console.error('Failed to unsubscribe:', error)
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   if (!isSupported) return null

//   return (
//     <div className="bg-white rounded-lg shadow-lg p-4 max-w-sm border border-gray-200">
//       <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
//         <span className="mr-2">🔔</span> Notifications
//       </h3>
      
//       {permission === 'denied' && (
//         <p className="text-sm text-red-600 mb-3 bg-red-50 p-2 rounded">
//           ❌ Notifications blocked. Please enable them in your browser settings.
//         </p>
//       )}
      
//       {subscription ? (
//         <button
//           onClick={unsubscribeFromPush}
//           disabled={isLoading}
//           className="w-full px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
//         >
//           {isLoading ? 'Disabling...' : 'Disable Notifications'}
//         </button>
//       ) : (
//         <button
//           onClick={subscribeToPush}
//           disabled={isLoading || permission === 'denied'}
//           className="w-full px-4 py-2 bg-[#C29307] text-white text-sm font-medium rounded-lg hover:bg-[#d4a414] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
//         >
//           {isLoading ? 'Enabling...' : 'Enable Notifications'}
//         </button>
//       )}
//     </div>
//   )
// }

// Install Prompt Component
export function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstallButton, setShowInstallButton] = useState(false)

  useEffect(() => {
    // Check if iOS
    setIsIOS(
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    )

    // Check if already installed
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches)

    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallButton(true)
    })

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallButton(false)
    }
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      console.log(`Install prompt outcome: ${outcome}`)
      
      if (outcome === 'accepted') {
        setShowInstallButton(false)
      }
      setDeferredPrompt(null)
    } else if (isIOS) {
      // Show iOS instructions
      alert('To install on iOS:\n\n1. Tap the share button (⎋)\n2. Scroll down and tap "Add to Home Screen"\n3. Tap "Add"')
    } else {
      // Show browser instructions
      alert('Click the install icon (⊕) in your browser\'s address bar')
    }
  }

  if (isStandalone) return null
  if (!showInstallButton && !isIOS) return null

  return (
    <div className="bg-gradient-to-r from-[#C29307] to-[#d4a414] rounded-lg p-4 max-w-sm text-white shadow-lg">
      <div className="flex items-start space-x-3">
         <Image
                     src="/logo.png"
                     alt="Zidwell Logo"
                     width={40}
                     height={40}
                     className="w-10 h-10 object-contain border-2 dark:border-gray-50 shadow-[4px_4px_0px_#111827] dark:shadow-[4px_4px_0px_#fbbf24] bg-black dark:bg-gray-950 p-1 border-[#C29307]"
                   />
        <div className="flex-1">
          <h3 className="font-semibold mb-1">Install Zidwell App</h3>
          <p className="text-sm text-white/90 mb-3">
            {isIOS 
              ? 'Install on your iPhone/iPad for the best experience'
              : 'Get the best experience with our app - install it on your device!'}
          </p>
          
          <button
            onClick={handleInstallClick}
            className="w-full px-4 py-2 bg-white text-[#C29307] text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isIOS ? 'Show iOS Instructions' : 'Install Now'}
          </button>
        </div>
      </div>
    </div>
  )
}