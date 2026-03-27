'use client'

import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'

export default function LogoutPage() {
  useEffect(() => {
    const doLogout = async () => {
      try {
        // Call logout API
        await fetch('/api/auth/logout', { method: 'POST' })
      } catch (e) {
        console.log('API error, continuing with local cleanup')
      }

      // Clear all storage
      if (typeof window !== 'undefined') {
        // Local storage
        localStorage.clear()
        sessionStorage.clear()

        // Clear all cookies - multiple approaches to be sure
        document.cookie.split(';').forEach((c) => {
          const name = c.split('=')[0].trim()
          // Try different domain/path combinations
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.affiliation-pro.pages.dev;`
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=affiliation-pro.pages.dev;`
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure;`
        })

        // Wait a moment then hard redirect
        setTimeout(() => {
          window.location.href = '/login'
        }, 1500)
      }
    }

    doLogout()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-950 to-black">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
        <p className="text-white text-lg">Déconnexion en cours...</p>
        <p className="text-zinc-400 text-sm mt-2">Tu seras redirigée dans un instant</p>
      </div>
    </div>
  )
}
