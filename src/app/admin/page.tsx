'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { StarryBackground } from '@/components/starry-background'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Users,
  DollarSign,
  Download,
  Sparkles,
  Search,
  ShoppingCart,
  Clock,
  Shield,
  Loader2,
  UserCheck,
  UserX,
  Calendar,
  Crown,
  BarChart3,
  RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'

interface AdminStats {
  totalAffiliates: number
  newAffiliatesThisMonth: number
  monthlySales: number
  pendingCommissions: number
  totalSalesCount: number
  totalRevenue: number
  totalPrograms: number
}

interface AffiliateItem {
  id: string
  email: string
  full_name: string | null
  affiliate_code: string
  created_at: string
  affiliates: Array<{
    id: string
    total_earnings: number
    total_referrals: number
    status: string
  }>
}

interface RecentSale {
  id: string
  amount: number
  status: string
  created_at: string
  commission_l1: number
  customer_email: string | null
  affiliates: {
    id: string
    user_id: string
    profile: {
      full_name: string | null
      email: string
    } | null
  } | null
}

interface AdminData {
  stats: AdminStats
  affiliates: AffiliateItem[]
  recentSales: RecentSale[]
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<AdminData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isExporting, setIsExporting] = useState(false)

  const fetchAdminData = useCallback(async (search?: string) => {
    try {
      const url = search ? `/api/admin?search=${encodeURIComponent(search)}` : '/api/admin'
      const response = await fetch(url)
      const result = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login')
          return
        }
        if (response.status === 403) {
          router.push('/dashboard')
          return
        }
        throw new Error(result.error)
      }

      setData(result)
    } catch (error) {
      console.error('Error fetching admin data:', error)
      toast.error('Erreur lors du chargement des données')
    } finally {
      setIsLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchAdminData()
  }, [fetchAdminData])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    fetchAdminData(searchQuery)
  }

  const handleExport = async (type: 'affiliates' | 'sales') => {
    setIsExporting(true)
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de l&apos;export')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${type}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      a.remove()

      toast.success('Export téléchargé avec succès')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Erreur lors de l&apos;export')
    } finally {
      setIsExporting(false)
    }
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
      year: 'numeric',
    })
  }

  if (isLoading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center">
        <StarryBackground />
        <div className="relative z-10 text-center">
          <Loader2 className="w-10 h-10 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Chargement du dashboard admin...</p>
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
            <Button onClick={() => fetchAdminData()} className="glass-button">
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { stats, affiliates, recentSales } = data

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
          <Badge className="ml-2 bg-amber-500/10 text-amber-400 border-amber-500/30">
            <Shield className="w-3 h-3 mr-1" />
            Admin
          </Badge>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-zinc-400 hover:text-white"
            onClick={() => { setIsLoading(true); fetchAdminData(); }}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
          <Link href="/login">
            <Button variant="ghost" className="text-zinc-400 hover:text-white">
              Déconnexion
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-6 py-8 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto">
          {/* Title */}
          <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <Crown className="w-8 h-8 text-amber-400" />
                Dashboard Admin
              </h1>
              <p className="text-zinc-400">
                Vue d&apos;ensemble de votre programme d&apos;affiliation
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="border-purple-500/20 text-zinc-300 hover:text-white hover:bg-purple-500/10"
                onClick={() => handleExport('affiliates')}
                disabled={isExporting}
              >
                <Download className="w-4 h-4 mr-2" />
                Exporter affiliés
              </Button>
              <Button
                variant="outline"
                className="border-purple-500/20 text-zinc-300 hover:text-white hover:bg-purple-500/10"
                onClick={() => handleExport('sales')}
                disabled={isExporting}
              >
                <Download className="w-4 h-4 mr-2" />
                Exporter ventes
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="glass-card glass-card-hover border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Users className="w-8 h-8 text-purple-500" />
                  <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20">
                    +{stats.newAffiliatesThisMonth} ce mois
                  </Badge>
                </div>
                <p className="text-zinc-400 text-sm mb-1">Total affiliés</p>
                <p className="text-2xl font-bold text-white">{stats.totalAffiliates}</p>
              </CardContent>
            </Card>

            <Card className="glass-card glass-card-hover border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <BarChart3 className="w-8 h-8 text-blue-500" />
                </div>
                <p className="text-zinc-400 text-sm mb-1">Ventes du mois</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(stats.monthlySales)}</p>
              </CardContent>
            </Card>

            <Card className="glass-card glass-card-hover border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Clock className="w-8 h-8 text-amber-500" />
                </div>
                <p className="text-zinc-400 text-sm mb-1">Commissions dues</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(stats.pendingCommissions)}</p>
              </CardContent>
            </Card>

            <Card className="glass-card glass-card-hover border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <DollarSign className="w-8 h-8 text-green-500" />
                </div>
                <p className="text-zinc-400 text-sm mb-1">Revenus totaux</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalRevenue)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="glass-card rounded-xl p-4 border border-purple-500/10">
              <p className="text-zinc-500 text-xs mb-1">Total ventes</p>
              <p className="text-xl font-bold text-white">{stats.totalSalesCount}</p>
            </div>
            <div className="glass-card rounded-xl p-4 border border-purple-500/10">
              <p className="text-zinc-500 text-xs mb-1">Programmes actifs</p>
              <p className="text-xl font-bold text-white">{stats.totalPrograms}</p>
            </div>
            <div className="glass-card rounded-xl p-4 border border-purple-500/10">
              <p className="text-zinc-500 text-xs mb-1">Nouveaux ce mois</p>
              <p className="text-xl font-bold text-white">{stats.newAffiliatesThisMonth}</p>
            </div>
            <div className="glass-card rounded-xl p-4 border border-purple-500/10">
              <p className="text-zinc-500 text-xs mb-1">Panier moyen</p>
              <p className="text-xl font-bold text-white">
                {stats.totalSalesCount > 0
                  ? formatCurrency(stats.totalRevenue / stats.totalSalesCount)
                  : formatCurrency(0)}
              </p>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Affiliates List */}
            <Card className="glass-card border-0">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-400" />
                    Liste des affiliés
                  </CardTitle>
                  <Badge className="bg-purple-500/10 text-purple-300 border-purple-500/20">
                    {affiliates.length} résultats
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {/* Search */}
                <form onSubmit={handleSearch} className="mb-4">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <Input
                        type="text"
                        placeholder="Rechercher par nom, email ou code..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-white/5 border-purple-500/20 text-white placeholder:text-zinc-500 focus:border-purple-500"
                      />
                    </div>
                    <Button type="submit" className="glass-button">
                      Rechercher
                    </Button>
                  </div>
                </form>

                {/* Affiliates Table */}
                <div className="max-h-96 overflow-y-auto custom-scrollbar">
                  {affiliates.length === 0 ? (
                    <div className="text-center py-8 text-zinc-500">
                      <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p>Aucun affilié trouvé</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {affiliates.map((affiliate) => (
                        <div
                          key={affiliate.id}
                          className="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-purple-500/10"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                                {affiliate.full_name?.[0]?.toUpperCase() || affiliate.email[0].toUpperCase()}
                              </div>
                              <div>
                                <p className="text-white font-medium">
                                  {affiliate.full_name || 'Sans nom'}
                                </p>
                                <p className="text-zinc-500 text-xs">{affiliate.email}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge
                                className={
                                  affiliate.affiliates?.[0]?.status === 'active'
                                    ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                    : affiliate.affiliates?.[0]?.status === 'paused'
                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                    : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                                }
                              >
                                {affiliate.affiliates?.[0]?.status === 'active' ? (
                                  <UserCheck className="w-3 h-3 mr-1" />
                                ) : (
                                  <UserX className="w-3 h-3 mr-1" />
                                )}
                                {affiliate.affiliates?.[0]?.status || 'actif'}
                              </Badge>
                              <p className="text-xs text-zinc-500 mt-1">
                                Code: {affiliate.affiliate_code}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-4 mt-2 pt-2 border-t border-purple-500/10 text-xs text-zinc-400">
                            <span>Gains: <span className="text-green-400 font-medium">{formatCurrency(affiliate.affiliates?.[0]?.total_earnings || 0)}</span></span>
                            <span>Referrals: <span className="text-white font-medium">{affiliate.affiliates?.[0]?.total_referrals || 0}</span></span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(affiliate.created_at)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Sales */}
            <Card className="glass-card border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-white flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-purple-400" />
                  Dernières ventes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto custom-scrollbar">
                  {recentSales.length === 0 ? (
                    <div className="text-center py-8 text-zinc-500">
                      <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p>Aucune vente récente</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {recentSales.map((sale) => (
                        <div
                          key={sale.id}
                          className="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-purple-500/10"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-white font-medium">
                                {formatCurrency(sale.amount)}
                              </p>
                              <p className="text-zinc-500 text-xs">
                                par {sale.affiliates?.profile?.full_name || sale.affiliates?.profile?.email || 'Affilié'}
                              </p>
                            </div>
                            <div className="text-right">
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
                              <p className="text-xs text-zinc-500 mt-1">
                                Commission: <span className="text-green-400">{formatCurrency(sale.commission_l1)}</span>
                              </p>
                            </div>
                          </div>
                          <div className="flex justify-between items-center mt-2 pt-2 border-t border-purple-500/10 text-xs text-zinc-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(sale.created_at)}
                            </span>
                            {sale.customer_email && (
                              <span>Client: {sale.customer_email.split('@')[0]}***</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Custom Scrollbar Styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(168, 85, 247, 0.05);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(168, 85, 247, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(168, 85, 247, 0.5);
        }
      `}</style>
    </div>
  )
}
