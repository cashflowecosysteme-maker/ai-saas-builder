'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { StarryBackground } from '@/components/starry-background'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Sparkles, Loader2, LogIn } from 'lucide-react'
import { toast } from 'sonner'
import { login } from '@/lib/auth-client'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const message = searchParams.get('message')
  const redirectTo = searchParams.get('redirect')

  useEffect(() => {
    if (message) {
      toast.success(message)
    }
  }, [message])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await login({
        email: formData.email,
        password: formData.password,
      })

      if (!result.success) {
        toast.error(result.error || 'Erreur de connexion')
        return
      }

      toast.success('Connexion réussie !')

      // Redirect based on role
      if (result.user?.role === 'super_admin') {
        router.push('/super-admin')
      } else if (result.user?.role === 'admin') {
        router.push('/admin')
      } else if (redirectTo) {
        router.push(redirectTo)
      } else {
        router.push('/dashboard')
      }
    } catch (error: any) {
      toast.error(error.message || 'Erreur de connexion')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="glass-card w-full max-w-md relative z-10">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold gradient-text">AffiliationPro</span>
        </div>
        <CardTitle className="text-2xl text-white">Connexion</CardTitle>
        <CardDescription className="text-zinc-400">
          Connecte-toi à ton compte
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-zinc-300">Courriel</Label>
            <Input
              id="email"
              type="email"
              placeholder="toi@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="bg-white/5 border-purple-500/20 text-white placeholder:text-zinc-500 focus:border-purple-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-zinc-300">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              className="bg-white/5 border-purple-500/20 text-white placeholder:text-zinc-500 focus:border-purple-500"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full glass-button text-white border-0 py-6 text-lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Connexion...
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5 mr-2" />
                Se connecter
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-zinc-400">
          Pas encore de compte ?{' '}
          <Link href="/signup" className="text-purple-400 hover:text-purple-300 font-medium">
            S&apos;inscrire gratuitement
          </Link>
        </div>

        <div className="mt-4 text-center text-xs text-zinc-500">
          <Link href="/" className="hover:text-zinc-400">
            ← Retour à l&apos;accueil
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

function LoginLoading() {
  return (
    <Card className="glass-card w-full max-w-md relative z-10">
      <CardContent className="p-8 text-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto" />
      </CardContent>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-4">
      <StarryBackground />
      <Suspense fallback={<LoginLoading />}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
