'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { StarryBackground } from '@/components/starry-background'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Sparkles, Loader2, Check } from 'lucide-react'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Generate a random referral code
  const generateReferralCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const userReferralCode = generateReferralCode()
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            referral_code: userReferralCode,
            referred_by: referralCode || null,
          },
        },
      })

      if (error) throw error

      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'inscription')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="relative min-h-screen flex items-center justify-center px-4">
        <StarryBackground />

        <Card className="glass-card w-full max-w-md relative z-10 text-center">
          <CardContent className="pt-8 pb-8">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Inscription réussie !</h2>
            <p className="text-zinc-400 mb-6">
              Vérifiez votre boîte email pour confirmer votre compte.
            </p>
            <Link href="/login">
              <Button className="glass-button text-white border-0">
                Aller à la connexion
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-8">
      <StarryBackground />

      <Card className="glass-card w-full max-w-md relative z-10">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">Affiliation Pro</span>
          </div>
          <CardTitle className="text-2xl text-white">Créer un compte</CardTitle>
          <CardDescription className="text-zinc-400">
            Rejoignez le programme d'affiliation 3 niveaux
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-zinc-300">Nom complet</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Jean Dupont"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="bg-white/5 border-purple-500/20 text-white placeholder:text-zinc-500 focus:border-purple-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-300">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="vous@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="bg-white/5 border-purple-500/20 text-white placeholder:text-zinc-500 focus:border-purple-500"
              />
              <p className="text-xs text-zinc-500">Minimum 6 caractères</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="referralCode" className="text-zinc-300">
                Code de parrainage <span className="text-zinc-500">(optionnel)</span>
              </Label>
              <Input
                id="referralCode"
                type="text"
                placeholder="ABC123"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                className="bg-white/5 border-purple-500/20 text-white placeholder:text-zinc-500 focus:border-purple-500"
              />
            </div>

            <Button
              type="submit"
              className="w-full glass-button text-white border-0 py-6"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Inscription...
                </>
              ) : (
                'Créer mon compte gratuit'
              )}
            </Button>

            <p className="text-xs text-center text-zinc-500 mt-4">
              En vous inscrivant, vous acceptez nos{' '}
              <Link href="/terms" className="text-purple-400 hover:underline">CGU</Link>
              {' '}et{' '}
              <Link href="/privacy" className="text-purple-400 hover:underline">Politique de confidentialité</Link>
            </p>
          </form>

          <div className="mt-6 text-center text-sm text-zinc-400">
            Déjà un compte ?{' '}
            <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium">
              Se connecter
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
