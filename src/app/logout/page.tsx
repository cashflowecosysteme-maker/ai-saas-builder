'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LogoutPage() {
  useEffect(() => {
    const logout = async () => {
      const supabase = createClient()
      
      // Sign out from Supabase - this clears the session properly
      await supabase.auth.signOut({ scope: 'global' })
      
      // Redirect to home
      window.location.href = '/'
    }
    
    logout()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-950 to-black">
      <p className="text-white">Déconnexion...</p>
    </div>
  )
}
