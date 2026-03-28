'use client'

import { useEffect } from 'react'
import { logout } from '@/lib/auth-client'

export default function LogoutPage() {
  useEffect(() => {
    logout()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-950 to-black">
      <p className="text-white">Déconnexion...</p>
    </div>
  )
}
