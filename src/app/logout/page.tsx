'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, CheckCircle } from 'lucide-react'

export default function LogoutPage() {
  const [status, setStatus] = useState<'loading' | 'done'>('loading')

  useEffect(() => {
    const doLogout = async () => {
      try {
        // Use Supabase client to sign out properly
        const supabase = createClient()
        await supabase.auth.signOut()
        
        // Also call our API for server-side cleanup
        await fetch('/api/auth/logout', { method: 'POST' })
      } catch (e) {
        console.log('Logout error:', e)
      }

      // Clear all storage
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()

        // Clear all cookies
        const cookies = document.cookie.split(';')
        for (const cookie of cookies) {
          const name = cookie.split('=')[0].trim()
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.pages.dev;`
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.cloudflare.com;`
        }
      }

      setStatus('done')
      
      // Redirect after showing success
      setTimeout(() => {
        window.location.href = '/login?force=true'
      }, 2000)
    }

    doLogout()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-950 to-black">
      <div className="text-center">
        {status === 'loading' ? (
          <>
            <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
            <p className="text-white text-lg">Déconnexion en cours...</p>
          </>
        ) : (
          <>
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <p className="text-white text-lg">Déconnexion réussie!</p>
            <p className="text-zinc-400 text-sm mt-2">Redirection vers la connexion...</p>
          </>
        )}
      </div>
    </div>
  )
}
