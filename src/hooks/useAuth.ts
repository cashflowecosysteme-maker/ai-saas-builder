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
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la déconnexion')
      }

      toast.success('Déconnexion réussie')

      // Clear any local storage
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
      }

      // Redirect to home page
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Erreur lors de la déconnexion')
    } finally {
      setIsLoggingOut(false)
    }
  }

  return { logout, isLoggingOut }
}
