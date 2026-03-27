'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { StarryBackground } from '@/components/starry-background'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Users,
  DollarSign,
  Copy,
  Check,
  Sparkles,
  ShoppingCart,
  Clock,
  Share2,
  Gift,
  UserPlus,
  BarChart3,
  Eye,
  Loader2,
  Crown,
  Calendar,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Profile, Affiliate, Sale } from '@/types/database'

interface DashboardStats {
  totalEarnings: number
  pendingCommissions: number
  totalClicks: number
  l1Referrals: number
  l2Referrals: number
  l3Referrals: number
  recentSales: Sale[]
  weeklySales: { date: string; total: number; count: number }[]
}

interface DashboardData {
  profile: Profile
  affiliate: (Affiliate & { program: { name: string; commission_l1: number; commission_l2: number; commission_l3: number } | null }) | null
  stats: DashboardStats
  parentInfo: { full_name: string | null; email: string } | null
  isAdmin?: boolean
}

export default function DashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchDashboard()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchDashboard = async () => {
    try {
      const response = await fetch('/api/dashboard')
      const result = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login')
          return
        }
        throw new Error(result.error)
      }

      // Check if admin
      if (result.isAdmin) {
        router.push('/admin')
        return
      }

      setData(result)
    } catch (error) {
      console.error('Error fetching dashboard:', error)
      toast.error('Erreur lors du chargement des données')
    } finally {
      setIsLoading(false)
    }
  }

  const copyLink = () => {
    const link = data?.affiliate?.affiliate_link || `${window.location.origin}/r/${data?.profile?.affiliate_code}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    toast.success('Lien copié !')
    setTimeout(() => setCopied(false), 2000)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    })
  }



  // Get day name from date
  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', { weekday: 'short' })
  }

  // Calculate max for chart
  const maxWeeklyTotal = Math.max(...(data?.stats.weeklySales.map(s => s.total) || [1]), 1)

  if (isLoading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center">
        <StarryBackground />
        <div className="relative z-10 text-center">
          <Loader2 className="w-10 h-10 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Chargement de votre dashboard...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="relative min-h-screen flex items-center justify-center">
        <StarryBackground />
        <Card className="glass-card max-w-md relative z-10">
          <CardContent className="p-8 text-center">
            <p className="text-zinc-400 mb-4">Impossible de charger les données</p>
            <Button onClick={fetchDashboard} className="glass-button">
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { profile, affiliate, stats } = data
  const referralLink = affiliate?.affiliate_link || `${typeof window !== 'undefined' ? window.location.origin : ''}/r/${profile.affiliate_code}`
  const totalReferrals = stats.l1Referrals + stats.l2Referrals + stats.l3Referrals

  return (
    <div className="relative min-h-screen">
      <StarryBackground />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-purple-500/10">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold gradient-text">AffiliationPro</span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:block text-right">
            <p className="text-sm text-white font-medium">{profile.full_name || 'Affilié'}</p>
            <p className="text-xs text-zinc-500">{profile.email}</p>
          </div>
          <Link href="/login">
            <Button variant="ghost" className="text-zinc-400 hover:text-white">
              Déconnexion
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-6 py-8 md:px-12 lg:px-24">
        <div className="max-w-6xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Bienvenue, {profile.full_name?.split(' ')[0] || 'Affilié'} 👋
            </h1>
            <p className="text-zinc-400">
              Voici un aperçu de vos performances d&apos;affiliation
            </p>
          </div>

          {/* Referral Link - Parrainer Section */}
          <Card className="glass-card mb-8 border-green-500/30 overflow-hidden relative">
            {/* Decorative gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-transparent to-emerald-500/10" />
            <CardContent className="p-6 relative">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Gift className="w-5 h-5 text-green-400" />
                    <h3 className="text-lg font-semibold text-white">Parrainez et gagnez</h3>
                  </div>
                  <p className="text-zinc-400 text-sm mb-3">
                    Partagez votre lien unique et gagnez des commissions sur 3 niveaux
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                      Niveau 1: {affiliate?.program?.commission_l1 || 25}%
                    </Badge>
                    <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                      Niveau 2: {affiliate?.program?.commission_l2 || 10}%
                    </Badge>
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                      Niveau 3: {affiliate?.program?.commission_l3 || 5}%
                    </Badge>
                  </div>
                </div>
                <div className="w-full lg:w-auto space-y-3">
                  <Label className="text-zinc-300 text-sm">Votre lien d&apos;affiliation</Label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 lg:w-80 bg-white/5 rounded-lg px-4 py-3 border border-purple-500/20 font-mono text-sm text-zinc-300 truncate">
                      {referralLink}
                    </div>
                    <Button onClick={copyLink} className="glass-button shrink-0 h-11">
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-purple-500/20 text-zinc-300 hover:text-white hover:bg-purple-500/10"
                      onClick={() => {
                        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent("Rejoignez le programme d'affiliation AffiliationPro! ")}&url=${encodeURIComponent(referralLink)}`, '_blank')
                      }}
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Partager
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-purple-500/20 text-zinc-300 hover:text-white hover:bg-purple-500/10"
                      onClick={() => {
                        navigator.clipboard.writeText(`${profile.full_name} vous invite à rejoindre AffiliationPro! ${referralLink}`)
                        toast.success('Message copié !')
                      }}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Inviter
                    </Button>
                  </div>
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
                    +{stats.weeklySales.reduce((sum, s) => sum + s.count, 0)} cette semaine
                  </Badge>
                </div>
                <p className="text-zinc-400 text-sm mb-1">Gains totaux</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalEarnings)}</p>
              </CardContent>
            </Card>

            <Card className="glass-card glass-card-hover border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Clock className="w-8 h-8 text-amber-500" />
                  <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20">
                    En attente
                  </Badge>
                </div>
                <p className="text-zinc-400 text-sm mb-1">Commissions en attente</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(stats.pendingCommissions)}</p>
              </CardContent>
            </Card>

            <Card className="glass-card glass-card-hover border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Users className="w-8 h-8 text-blue-500" />
                </div>
                <p className="text-zinc-400 text-sm mb-1">Filleuls (L1/L2/L3)</p>
                <p className="text-2xl font-bold text-white">{totalReferrals}</p>
                <div className="flex gap-2 mt-2 text-xs text-zinc-500">
                  <span>L1: {stats.l1Referrals}</span>
                  <span>L2: {stats.l2Referrals}</span>
                  <span>L3: {stats.l3Referrals}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card glass-card-hover border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Eye className="w-8 h-8 text-purple-500" />
                </div>
                <p className="text-zinc-400 text-sm mb-1">Clics totaux</p>
                <p className="text-2xl font-bold text-white">{stats.totalClicks}</p>
              </CardContent>
            </Card>
          </div>

          {/* Chart and Commission Levels */}
          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            {/* Weekly Sales Chart */}
            <Card className="glass-card border-0 lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                  Ventes des 7 derniers jours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between h-40 gap-2">
                  {stats.weeklySales.map((day, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full flex flex-col items-center justify-end h-32">
                        <div
                          className="w-full max-w-8 rounded-t-lg bg-gradient-to-t from-purple-600 to-purple-400 transition-all duration-500 hover:from-purple-500 hover:to-purple-300"
                          style={{
                            height: `${Math.max((day.total / maxWeeklyTotal) * 100, 4)}%`,
                            minHeight: day.total > 0 ? '8px' : '4px',
                          }}
                          title={`${formatCurrency(day.total)} - ${day.count} vente(s)`}
                        />
                      </div>
                      <span className="text-xs text-zinc-500">{getDayName(day.date)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-purple-500/10 flex justify-between text-sm">
                  <span className="text-zinc-400">Total semaine</span>
                  <span className="text-white font-semibold">
                    {formatCurrency(stats.weeklySales.reduce((sum, s) => sum + s.total, 0))}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Commission Levels */}
            <Card className="glass-card border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-white flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-400" />
                  Niveaux de commission
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-semibold">Niveau 1</span>
                    <Badge className="bg-purple-500/20 text-purple-300">Direct</Badge>
                  </div>
                  <p className="text-2xl font-bold gradient-text">{affiliate?.program?.commission_l1 || 25}%</p>
                  <p className="text-xs text-zinc-500 mt-1">{stats.l1Referrals} filleul(s) actif(s)</p>
                </div>

                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-semibold">Niveau 2</span>
                    <Badge className="bg-blue-500/20 text-blue-300">Indirect</Badge>
                  </div>
                  <p className="text-2xl font-bold text-blue-400">{affiliate?.program?.commission_l2 || 10}%</p>
                  <p className="text-xs text-zinc-500 mt-1">{stats.l2Referrals} filleul(s) actif(s)</p>
                </div>

                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-semibold">Niveau 3</span>
                    <Badge className="bg-green-500/20 text-green-300">Indirect</Badge>
                  </div>
                  <p className="text-2xl font-bold text-green-400">{affiliate?.program?.commission_l3 || 5}%</p>
                  <p className="text-xs text-zinc-500 mt-1">{stats.l3Referrals} filleul(s) actif(s)</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Sales Table */}
          <Card className="glass-card border-0">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-purple-400" />
                  Dernières commissions
                </CardTitle>
                <Badge className="bg-purple-500/10 text-purple-300 border-purple-500/20">
                  {stats.recentSales.length} ventes
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {stats.recentSales.length === 0 ? (
                <div className="text-center py-12 text-zinc-500">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-lg mb-1">Aucune vente pour le moment</p>
                  <p className="text-sm">Partagez votre lien pour commencer à gagner</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-purple-500/10">
                        <th className="text-left text-xs text-zinc-500 font-medium pb-3">Date</th>
                        <th className="text-left text-xs text-zinc-500 font-medium pb-3">Client</th>
                        <th className="text-right text-xs text-zinc-500 font-medium pb-3">Montant</th>
                        <th className="text-right text-xs text-zinc-500 font-medium pb-3">Commission L1</th>
                        <th className="text-center text-xs text-zinc-500 font-medium pb-3">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-500/5">
                      {stats.recentSales.map((sale) => (
                        <tr key={sale.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-zinc-500" />
                              <span className="text-zinc-300 text-sm">{formatDate(sale.created_at)}</span>
                            </div>
                          </td>
                          <td className="py-4">
                            <span className="text-zinc-400 text-sm">
                              {sale.customer_email ? sale.customer_email.split('@')[0] + '***' : 'Anonyme'}
                            </span>
                          </td>
                          <td className="py-4 text-right">
                            <span className="text-white font-medium">{formatCurrency(sale.amount)}</span>
                          </td>
                          <td className="py-4 text-right">
                            <span className="text-green-400 font-medium">{formatCurrency(sale.commission_l1)}</span>
                          </td>
                          <td className="py-4 text-center">
                            <Badge
                              className={
                                sale.status === 'paid'
                                  ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                  : sale.status === 'pending'
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                  : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                              }
                            >
                              {sale.status === 'paid' ? 'Payé' : sale.status === 'pending' ? 'En attente' : sale.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Affiliate Code */}
          <div className="mt-8 p-4 rounded-xl bg-purple-500/5 border border-purple-500/10 text-center">
            <p className="text-zinc-500 text-sm mb-2">Votre code d&apos;affiliation</p>
            <p className="text-2xl font-mono font-bold gradient-text">{profile.affiliate_code}</p>
          </div>
        </div>
      </main>
    </div>
  )
}
