'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

export function useAuth() {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const logout = async () => {
    setIsLoggingOut(true)
    try {
      // Call logout API
      await fetch('/api/auth/logout', {
        method: 'POST',
      })

      // Clear all storage
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()

        // Clear all cookies by setting them to expire in the past
        document.cookie.split(';').forEach((c) => {
          document.cookie = c
            .replace(/^ +/, '')
            .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/')
        })
      }

      toast.success('Déconnexion réussie')

      // Force hard redirect to login page
      window.location.href = '/login'
    } catch (error) {
      console.error('Logout error:', error)
      // Even if API fails, clear local and redirect
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
        document.cookie.split(';').forEach((c) => {
          document.cookie = c
            .replace(/^ +/, '')
            .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/')
        })
      }
      window.location.href = '/login'
    } finally {
      setIsLoggingOut(false)
    }
  }

  return { logout, isLoggingOut }
}
