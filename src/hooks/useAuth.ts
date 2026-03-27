'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function useAuth() {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const logout = () => {
    setIsLoggingOut(true)
    // Simply redirect to logout page which handles everything
    window.location.href = '/logout'
  }

  return { logout, isLoggingOut }
}
