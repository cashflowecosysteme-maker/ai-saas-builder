'use client'

import Link from 'next/link'
import { StarryBackground } from '@/components/starry-background'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Sparkles } from 'lucide-react'

export default function LoginPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-4">
      <StarryBackground />

      <Card className="glass-card w-full max-w-md relative z-10">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">Affiliation Pro</span>
          </div>
          <CardTitle className="text-2xl text-white">Connexion</CardTitle>
          <CardDescription className="text-zinc-400">
            Connectez-vous à votre compte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-300">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="vous@email.com"
                className="bg-white/5 border-purple-500/20 text-white placeholder:text-zinc-500 focus:border-purple-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-zinc-300">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="bg-white/5 border-purple-500/20 text-white placeholder:text-zinc-500 focus:border-purple-500"
              />
            </div>

            <Link href="/dashboard">
              <Button className="w-full glass-button text-white border-0 py-6">
                Se connecter
              </Button>
            </Link>
          </div>

          <div className="mt-6 text-center text-sm text-zinc-400">
            Pas encore de compte ?{' '}
            <Link href="/signup" className="text-purple-400 hover:text-purple-300 font-medium">
              S&apos;inscrire gratuitement
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
