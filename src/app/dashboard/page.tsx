'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { StarryBackground } from '@/components/starry-background'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  TrendingUp,
  Users,
  DollarSign,
  Link2,
  Copy,
  Check,
  LogOut,
  User,
  Settings,
  Sparkles,
  ChevronDown,
  Eye,
  MousePointer,
  ShoppingCart,
} from 'lucide-react'

interface User {
  id: string
  email: string
  user_metadata: {
    full_name?: string
    referral_code?: string
  }
}

interface Stats {
  totalEarnings: number
  pendingCommissions: number
  totalReferrals: number
  clicks: number
  conversions: number
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [stats, setStats] = useState<Stats>({
    totalEarnings: 0,
    pendingCommissions: 0,
    totalReferrals: 0,
    clicks: 0,
    conversions: 0,
  })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      setUser(user as User)
      setLoading(false)
    }

    getUser()
  }, [router, supabase.auth])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const referralLink = user?.user_metadata?.referral_code
    ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://affiliationpro.publication-web.com'}/r/${user.user_metadata.referral_code}`
    : ''

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center">
        <StarryBackground />
        <div className="relative z-10 text-center">
          <Sparkles className="w-8 h-8 text-purple-400 animate-pulse mx-auto mb-4" />
          <p className="text-zinc-400">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen">
      <StarryBackground />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-purple-500/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold gradient-text">Affiliation Pro</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="text-zinc-300 hover:text-white hover:bg-white/5">
              <User className="w-4 h-4 mr-2" />
              {user?.user_metadata?.full_name || user?.email}
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="glass-card border-purple-500/20">
            <DropdownMenuLabel className="text-white">Mon compte</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-purple-500/20" />
            <DropdownMenuItem className="text-zinc-300 focus:text-white focus:bg-purple-500/10">
              <Settings className="w-4 h-4 mr-2" />
              Paramètres
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={handleLogout}
              className="text-red-400 focus:text-red-300 focus:bg-red-500/10"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-6 py-8 md:px-12 lg:px-24">
        <div className="max-w-6xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Bienvenue, {user?.user_metadata?.full_name || 'Affilié'} 👋
            </h1>
            <p className="text-zinc-400">
              Voici un aperçu de vos performances d'affiliation
            </p>
          </div>

          {/* Referral Link */}
          <Card className="glass-card mb-8 border-0">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Votre lien d'affiliation</h3>
                  <p className="text-zinc-400 text-sm">Partagez ce lien pour gagner des commissions</p>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <div className="flex-1 md:flex-none bg-white/5 rounded-lg px-4 py-2 border border-purple-500/20 font-mono text-sm text-zinc-300 truncate">
                    {referralLink}
                  </div>
                  <Button onClick={copyLink} className="glass-button shrink-0">
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="glass-card glass-card-hover border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <DollarSign className="w-8 h-8 text-green-500" />
                  <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                    +12.5%
                  </Badge>
                </div>
                <p className="text-zinc-400 text-sm mb-1">Gains totaux</p>
                <p className="text-2xl font-bold text-white">€{stats.totalEarnings.toFixed(2)}</p>
              </CardContent>
            </Card>

            <Card className="glass-card glass-card-hover border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <TrendingUp className="w-8 h-8 text-purple-500" />
                  <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20">
                    En attente
                  </Badge>
                </div>
                <p className="text-zinc-400 text-sm mb-1">Commissions en attente</p>
                <p className="text-2xl font-bold text-white">€{stats.pendingCommissions.toFixed(2)}</p>
              </CardContent>
            </Card>

            <Card className="glass-card glass-card-hover border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Users className="w-8 h-8 text-blue-500" />
                </div>
                <p className="text-zinc-400 text-sm mb-1">Total referrals</p>
                <p className="text-2xl font-bold text-white">{stats.totalReferrals}</p>
              </CardContent>
            </Card>

            <Card className="glass-card glass-card-hover border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <ShoppingCart className="w-8 h-8 text-orange-500" />
                </div>
                <p className="text-zinc-400 text-sm mb-1">Conversions</p>
                <p className="text-2xl font-bold text-white">{stats.conversions}</p>
              </CardContent>
            </Card>
          </div>

          {/* Commission Levels */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="glass-card border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">1</span>
                  Niveau 1
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold gradient-text mb-2">25%</p>
                <p className="text-zinc-400 text-sm">Sur vos ventes directes</p>
                <div className="mt-4 pt-4 border-t border-purple-500/10">
                  <p className="text-zinc-500 text-xs">Referrals actifs</p>
                  <p className="text-white font-semibold">0</p>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-blue-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">2</span>
                  Niveau 2
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-blue-400 mb-2">10%</p>
                <p className="text-zinc-400 text-sm">Sur les ventes de vos filleuls</p>
                <div className="mt-4 pt-4 border-t border-blue-500/10">
                  <p className="text-zinc-500 text-xs">Referrals actifs</p>
                  <p className="text-white font-semibold">0</p>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-green-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">3</span>
                  Niveau 3
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-400 mb-2">5%</p>
                <p className="text-zinc-400 text-sm">Sur les ventes de niveau 3</p>
                <div className="mt-4 pt-4 border-t border-green-500/10">
                  <p className="text-zinc-500 text-xs">Referrals actifs</p>
                  <p className="text-white font-semibold">0</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="glass-card border-0">
              <CardHeader>
                <CardTitle className="text-white">Actions rapides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full glass-button justify-start" variant="ghost">
                  <Link2 className="w-4 h-4 mr-2" />
                  Générer un lien personnalisé
                </Button>
                <Button className="w-full glass-button justify-start" variant="ghost">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Créer avec l'IA
                </Button>
                <Button className="w-full glass-button justify-start" variant="ghost">
                  <Eye className="w-4 h-4 mr-2" />
                  Voir les statistiques détaillées
                </Button>
              </CardContent>
            </Card>

            <Card className="glass-card border-0">
              <CardHeader>
                <CardTitle className="text-white">Activité récente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-zinc-500">
                  <MousePointer className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Aucune activité récente</p>
                  <p className="text-sm">Partagez votre lien pour commencer</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
