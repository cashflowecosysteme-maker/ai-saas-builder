'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { StarryBackground } from '@/components/starry-background'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  Settings,
  Mail,
  MessageSquare,
  Send,
  Key,
  Globe,
  Plus,
  Eye,
  EyeOff,
  Lock,
  Edit,
  Copy,
  Check,
  X,
  CreditCard,
  Building,
  User,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { toast } from 'sonner'

type TabType = 'dashboard' | 'admins' | 'affiliates' | 'messaging' | 'settings'

interface Profile {
  id: string
  email: string
  full_name: string | null
  affiliate_code: string
  role: 'super_admin' | 'admin' | 'affiliate'
  paypal_email: string | null
  subdomain: string | null
  admin_id: string | null
  created_at: string
  admin?: { full_name: string | null; email: string } | null
  affiliates?: Array<{
    id: string
    total_earnings: number
    total_referrals: number
    status: string
  }>
}

interface Sale {
  id: string
  amount: number
  status: string
  created_at: string
  commission_l1: number
  customer_email: string | null
  affiliates: {
    id: string
    user_id: string
    profile: { full_name: string | null; email: string; role: string } | null
  } | null
}

interface Message {
  id: string
  subject: string
  content: string
  sender_id: string
  recipient_id: string | null
  is_broadcast: boolean
  created_at: string
  read_at: string | null
  sender: { full_name: string | null; email: string } | null
  recipient: { full_name: string | null; email: string } | null
}

interface SuperAdminData {
  stats: {
    totalUsers: number
    totalAdmins: number
    totalAffiliates: number
    totalSales: number
    totalRevenue: number
    pendingPayouts: number
    totalPayouts: number
  }
  admins: Profile[]
  affiliates: Profile[]
  recentSales: Sale[]
  messages: Message[]
}

export default function SuperAdminPage() {
  const router = useRouter()
  const [data, setData] = useState<SuperAdminData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')
  const [searchQuery, setSearchQuery] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  
  // New user form
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'admin' as 'admin' | 'affiliate',
    subdomain: '',
    adminId: '',
  })
  const [isCreatingUser, setIsCreatingUser] = useState(false)
  
  // Password reset
  const [resetUserId, setResetUserId] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState<{ [key: string]: boolean }>({})
  
  // Subdomain editing
  const [editingSubdomain, setEditingSubdomain] = useState<string | null>(null)
  const [subdomainValue, setSubdomainValue] = useState('')
  
  // Messaging
  const [messageSubject, setMessageSubject] = useState('')
  const [messageContent, setMessageContent] = useState('')
  const [isBroadcast, setIsBroadcast] = useState(true)
  const [selectedRecipient, setSelectedRecipient] = useState('')
  const [isSending, setIsSending] = useState(false)
  
  // Admin password change
  const [adminPassword, setAdminPassword] = useState({ current: '', new: '', confirm: '' })
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  const fetchData = useCallback(async (search?: string) => {
    try {
      const url = search ? `/api/super-admin?search=${encodeURIComponent(search)}` : '/api/super-admin'
      const response = await fetch(url)
      const result = await response.json()

      if (!response.ok) {
        if (response.status === 401) router.push('/login')
        else if (response.status === 403) router.push('/dashboard')
        else throw new Error(result.error)
        return
      }

      setData(result)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Erreur lors du chargement')
    } finally {
      setIsLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    fetchData(searchQuery)
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreatingUser(true)

    try {
      const response = await fetch('/api/super-admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)

      toast.success('Utilisateur créé avec succès')
      setNewUser({ email: '', password: '', fullName: '', role: 'admin', subdomain: '', adminId: '' })
      fetchData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur')
    } finally {
      setIsCreatingUser(false)
    }
  }

  const handleResetPassword = async (userId: string) => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères')
      return
    }

    try {
      const response = await fetch('/api/super-admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newPassword }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)

      toast.success('Mot de passe réinitialisé')
      setResetUserId(null)
      setNewPassword('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur')
    }
  }

  const handleUpdateSubdomain = async (userId: string) => {
    try {
      const response = await fetch('/api/super-admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, subdomain: subdomainValue }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)

      toast.success('Sous-domaine mis à jour')
      setEditingSubdomain(null)
      setSubdomainValue('')
      fetchData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur')
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageSubject || !messageContent) {
      toast.error('Veuillez remplir tous les champs')
      return
    }
    if (!isBroadcast && !selectedRecipient) {
      toast.error('Veuillez sélectionner un destinataire')
      return
    }

    setIsSending(true)
    try {
      const response = await fetch('/api/super-admin/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: messageSubject,
          content: messageContent,
          recipientId: isBroadcast ? null : selectedRecipient,
          isBroadcast,
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)

      toast.success(isBroadcast ? 'Message envoyé à tous' : 'Message envoyé')
      setMessageSubject('')
      setMessageContent('')
      setSelectedRecipient('')
      fetchData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur')
    } finally {
      setIsSending(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (adminPassword.new !== adminPassword.confirm) {
      toast.error('Les mots de passe ne correspondent pas')
      return
    }
    if (adminPassword.new.length < 6) {
      toast.error('Minimum 6 caractères')
      return
    }

    setIsChangingPassword(true)
    try {
      const response = await fetch('/api/super-admin/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminPassword),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)

      toast.success('Mot de passe modifié')
      setAdminPassword({ current: '', new: '', confirm: '' })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleExport = async (type: 'users' | 'sales') => {
    setIsExporting(true)
    try {
      const response = await fetch(`/api/super-admin/export?type=${type}`)
      if (!response.ok) throw new Error('Erreur')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${type}_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success('Export téléchargé')
    } catch {
      toast.error('Erreur lors de l\'export')
    } finally {
      setIsExporting(false)
    }
  }

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)
  
  const formatDate = (dateStr: string) => 
    new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copié !')
  }

  if (isLoading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center">
        <StarryBackground />
        <div className="relative z-10 text-center">
          <Loader2 className="w-10 h-10 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Chargement...</p>
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
            <p className="text-zinc-400 mb-4">Accès non autorisé</p>
            <Button onClick={() => router.push('/login')} className="glass-button">Connexion</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen">
      <StarryBackground />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-purple-500/10">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Crown className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold gradient-text">AffiliationPro</span>
          </Link>
          <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30">
            <Shield className="w-3 h-3 mr-1" />
            SUPER ADMIN
          </Badge>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white" onClick={() => { setIsLoading(true); fetchData(); }}>
            <RefreshCw className="w-4 h-4 mr-2" />Actualiser
          </Button>
          <Link href="/login">
            <Button variant="ghost" className="text-zinc-400 hover:text-white">Déconnexion</Button>
          </Link>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="relative z-10 px-6 pt-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-2 border-b border-purple-500/10 pb-4 overflow-x-auto">
            {[
              { id: 'dashboard' as TabType, label: 'Dashboard', icon: BarChart3 },
              { id: 'admins' as TabType, label: 'Admins', icon: Building },
              { id: 'affiliates' as TabType, label: 'Affiliés', icon: Users },
              { id: 'messaging' as TabType, label: 'Messagerie', icon: MessageSquare },
              { id: 'settings' as TabType, label: 'Paramètres', icon: Settings },
            ].map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'ghost'}
                className={`flex items-center gap-2 ${activeTab === tab.id ? 'glass-button text-white' : 'text-zinc-400 hover:text-white'}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 px-6 py-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto">

          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <>
              <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-3">
                    <Crown className="w-6 h-6 text-amber-400" />
                    Tableau de bord Super Admin
                  </h1>
                  <p className="text-zinc-400 text-sm">Vue globale de la plateforme AffiliationPro</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="border-purple-500/20 text-zinc-300" onClick={() => handleExport('users')} disabled={isExporting}>
                    <Download className="w-4 h-4 mr-2" />Exporter utilisateurs
                  </Button>
                  <Button variant="outline" size="sm" className="border-purple-500/20 text-zinc-300" onClick={() => handleExport('sales')} disabled={isExporting}>
                    <Download className="w-4 h-4 mr-2" />Exporter ventes
                  </Button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
                <Card className="glass-card border-0">
                  <CardContent className="p-4 text-center">
                    <Users className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{data.stats.totalUsers}</p>
                    <p className="text-zinc-500 text-xs">Total utilisateurs</p>
                  </CardContent>
                </Card>
                <Card className="glass-card border-0">
                  <CardContent className="p-4 text-center">
                    <Building className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{data.stats.totalAdmins}</p>
                    <p className="text-zinc-500 text-xs">Admins</p>
                  </CardContent>
                </Card>
                <Card className="glass-card border-0">
                  <CardContent className="p-4 text-center">
                    <User className="w-6 h-6 text-green-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{data.stats.totalAffiliates}</p>
                    <p className="text-zinc-500 text-xs">Affiliés</p>
                  </CardContent>
                </Card>
                <Card className="glass-card border-0">
                  <CardContent className="p-4 text-center">
                    <ShoppingCart className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{data.stats.totalSales}</p>
                    <p className="text-zinc-500 text-xs">Ventes</p>
                  </CardContent>
                </Card>
                <Card className="glass-card border-0">
                  <CardContent className="p-4 text-center">
                    <TrendingUp className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{formatCurrency(data.stats.totalRevenue)}</p>
                    <p className="text-zinc-500 text-xs">Revenus</p>
                  </CardContent>
                </Card>
                <Card className="glass-card border-0">
                  <CardContent className="p-4 text-center">
                    <Clock className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{formatCurrency(data.stats.pendingPayouts)}</p>
                    <p className="text-zinc-500 text-xs">En attente</p>
                  </CardContent>
                </Card>
                <Card className="glass-card border-0">
                  <CardContent className="p-4 text-center">
                    <Wallet className="w-6 h-6 text-pink-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{formatCurrency(data.stats.totalPayouts)}</p>
                    <p className="text-zinc-500 text-xs">Payés</p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Sales */}
              <Card className="glass-card border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white flex items-center gap-2 text-lg">
                    <ShoppingCart className="w-5 h-5 text-purple-400" />
                    Dernières ventes globales
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-96 overflow-y-auto custom-scrollbar">
                    {data.recentSales.length === 0 ? (
                      <div className="text-center py-8 text-zinc-500">
                        <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p>Aucune vente</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {data.recentSales.map((sale) => (
                          <div key={sale.id} className="p-3 rounded-lg bg-white/5 border border-purple-500/10">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-white font-medium">{formatCurrency(sale.amount)}</p>
                                <p className="text-zinc-500 text-xs">
                                  Par: {sale.affiliates?.profile?.full_name || sale.affiliates?.profile?.email || 'Inconnu'}
                                  <Badge className="ml-2 text-xs" variant="outline">
                                    {sale.affiliates?.profile?.role === 'admin' ? 'Admin' : 'Affilié'}
                                  </Badge>
                                </p>
                              </div>
                              <div className="text-right">
                                <Badge className={sale.status === 'paid' ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'}>
                                  {sale.status === 'paid' ? 'Payé' : 'En attente'}
                                </Badge>
                                <p className="text-xs text-zinc-500 mt-1">Commission: {formatCurrency(sale.commission_l1)}</p>
                              </div>
                            </div>
                            <div className="flex justify-between mt-2 pt-2 border-t border-purple-500/10 text-xs text-zinc-400">
                              <span><Calendar className="w-3 h-3 inline mr-1" />{formatDate(sale.created_at)}</span>
                              {sale.customer_email && <span>Client: {sale.customer_email}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* ADMINS TAB */}
          {activeTab === 'admins' && (
            <div className="space-y-6">
              {/* Create Admin */}
              <Card className="glass-card border-0 border-green-500/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white flex items-center gap-2 text-lg">
                    <Plus className="w-5 h-5 text-green-400" />
                    Créer un compte Admin (Client)
                  </CardTitle>
                  <CardDescription className="text-zinc-400">
                    Nouveau client entreprise qui utilisera AffiliationPro
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateUser} className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <Input placeholder="Nom complet" value={newUser.fullName} onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })} required className="h-10 bg-white/5 border-purple-500/20 text-white" />
                    <Input type="email" placeholder="Email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} required className="h-10 bg-white/5 border-purple-500/20 text-white" />
                    <Input type="text" placeholder="Mot de passe" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} required minLength={6} className="h-10 bg-white/5 border-purple-500/20 text-white" />
                    <Input placeholder="Sous-domaine (optionnel)" value={newUser.subdomain} onChange={(e) => setNewUser({ ...newUser, subdomain: e.target.value.toLowerCase() })} className="h-10 bg-white/5 border-purple-500/20 text-white" />
                    <Button type="submit" disabled={isCreatingUser} className="glass-button h-10">
                      {isCreatingUser ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4 mr-2" />Créer Admin</>}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Admin List */}
              <Card className="glass-card border-0">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2 text-lg">
                      <Building className="w-5 h-5 text-blue-400" />
                      Liste des Admins ({data.admins.length})
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="max-h-[500px] overflow-y-auto custom-scrollbar space-y-3">
                    {data.admins.map((admin) => (
                      <div key={admin.id} className="p-4 rounded-lg bg-white/5 border border-purple-500/10">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-bold">
                              {admin.full_name?.[0]?.toUpperCase() || admin.email[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="text-white font-medium">{admin.full_name || 'Sans nom'}</p>
                              <p className="text-zinc-400 text-sm flex items-center gap-2">
                                <Mail className="w-3 h-3" />{admin.email}
                                <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => copyToClipboard(admin.email)}>
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </p>
                              <p className="text-zinc-500 text-xs">Code: {admin.affiliate_code} • {formatDate(admin.created_at)}</p>
                            </div>
                          </div>
                          <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                            <Building className="w-3 h-3 mr-1" />Admin
                          </Badge>
                        </div>

                        {/* Subdomain */}
                        <div className="mt-3 pt-3 border-t border-purple-500/10 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm">
                            <Globe className="w-4 h-4 text-blue-400" />
                            <span className="text-zinc-400">Sous-domaine:</span>
                            {editingSubdomain === admin.id ? (
                              <div className="flex items-center gap-2">
                                <Input value={subdomainValue} onChange={(e) => setSubdomainValue(e.target.value.toLowerCase())} className="h-8 w-40 bg-white/5 border-purple-500/20 text-white text-sm" />
                                <Button size="sm" className="h-8 glass-button" onClick={() => handleUpdateSubdomain(admin.id)}><Check className="w-4 h-4" /></Button>
                                <Button size="sm" variant="ghost" className="h-8" onClick={() => { setEditingSubdomain(null); setSubdomainValue(''); }}><X className="w-4 h-4" /></Button>
                              </div>
                            ) : (
                              <span className="text-white">
                                {admin.subdomain ? `${admin.subdomain}.affiliationpro.publication-web.com` : 'Non configuré'}
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-2" onClick={() => { setEditingSubdomain(admin.id); setSubdomainValue(admin.subdomain || ''); }}>
                                  <Edit className="w-3 h-3" />
                                </Button>
                              </span>
                            )}
                          </div>

                          {/* Password Reset */}
                          <div className="flex items-center gap-2">
                            {resetUserId === admin.id ? (
                              <div className="flex items-center gap-2">
                                <div className="relative">
                                  <Input type={showPassword[admin.id] ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Nouveau MDP" className="h-8 w-32 bg-white/5 border-purple-500/20 text-white text-sm pr-8" />
                                  <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-8 w-8 p-0" onClick={() => setShowPassword({ ...showPassword, [admin.id]: !showPassword[admin.id] })}>
                                    {showPassword[admin.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                  </Button>
                                </div>
                                <Button size="sm" className="h-8 glass-button" onClick={() => handleResetPassword(admin.id)}><Check className="w-4 h-4" /></Button>
                                <Button size="sm" variant="ghost" className="h-8" onClick={() => { setResetUserId(null); setNewPassword(''); }}><X className="w-4 h-4" /></Button>
                              </div>
                            ) : (
                              <Button variant="outline" size="sm" className="h-8 border-purple-500/20 text-zinc-300" onClick={() => setResetUserId(admin.id)}>
                                <Key className="w-3 h-3 mr-1" />Réinitialiser MDP
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* AFFILIATES TAB */}
          {activeTab === 'affiliates' && (
            <div className="space-y-6">
              {/* Create Affiliate */}
              <Card className="glass-card border-0 border-green-500/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white flex items-center gap-2 text-lg">
                    <Plus className="w-5 h-5 text-green-400" />
                    Créer un compte Affilié
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateUser} className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <Input placeholder="Nom complet" value={newUser.fullName} onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })} required className="h-10 bg-white/5 border-purple-500/20 text-white" />
                    <Input type="email" placeholder="Email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} required className="h-10 bg-white/5 border-purple-500/20 text-white" />
                    <Input type="text" placeholder="Mot de passe" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} required minLength={6} className="h-10 bg-white/5 border-purple-500/20 text-white" />
                    <select value={newUser.adminId} onChange={(e) => setNewUser({ ...newUser, adminId: e.target.value })} className="h-10 rounded-md bg-white/5 border border-purple-500/20 text-white px-3">
                      <option value="">Sélectionner un Admin</option>
                      {data.admins.map((a) => <option key={a.id} value={a.id}>{a.full_name || a.email}</option>)}
                    </select>
                    <Button type="submit" disabled={isCreatingUser} className="glass-button h-10">
                      {isCreatingUser ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4 mr-2" />Créer Affilié</>}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Search */}
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <Input placeholder="Rechercher..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 bg-white/5 border-purple-500/20 text-white" />
                </div>
                <Button type="submit" className="glass-button">Rechercher</Button>
              </form>

              {/* Affiliates List */}
              <Card className="glass-card border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white flex items-center gap-2 text-lg">
                    <Users className="w-5 h-5 text-green-400" />
                    Liste des Affiliés ({data.affiliates.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-[500px] overflow-y-auto custom-scrollbar space-y-3">
                    {data.affiliates.map((affiliate) => (
                      <div key={affiliate.id} className="p-4 rounded-lg bg-white/5 border border-purple-500/10">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                              {affiliate.full_name?.[0]?.toUpperCase() || affiliate.email[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="text-white font-medium">{affiliate.full_name || 'Sans nom'}</p>
                              <p className="text-zinc-400 text-sm">{affiliate.email}</p>
                              <p className="text-zinc-500 text-xs">Code: {affiliate.affiliate_code} • Admin: {affiliate.admin?.full_name || affiliate.admin?.email || 'N/A'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {resetUserId === affiliate.id ? (
                              <div className="flex items-center gap-2">
                                <Input type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Nouveau MDP" className="h-8 w-32 bg-white/5 border-purple-500/20 text-white text-sm" />
                                <Button size="sm" className="h-8 glass-button" onClick={() => handleResetPassword(affiliate.id)}><Check className="w-4 h-4" /></Button>
                                <Button size="sm" variant="ghost" className="h-8" onClick={() => { setResetUserId(null); setNewPassword(''); }}><X className="w-4 h-4" /></Button>
                              </div>
                            ) : (
                              <Button variant="outline" size="sm" className="h-8 border-purple-500/20 text-zinc-300" onClick={() => setResetUserId(affiliate.id)}>
                                <Key className="w-3 h-3 mr-1" />MDP
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* MESSAGING TAB */}
          {activeTab === 'messaging' && (
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="glass-card border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white flex items-center gap-2 text-lg">
                    <Send className="w-5 h-5 text-purple-400" />
                    Envoyer un message
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSendMessage} className="space-y-4">
                    <div className="flex gap-2">
                      <Button type="button" variant={isBroadcast ? 'default' : 'outline'} size="sm" className={isBroadcast ? 'glass-button' : 'border-purple-500/20 text-zinc-300'} onClick={() => setIsBroadcast(true)}>
                        <Users className="w-4 h-4 mr-1" />Tous
                      </Button>
                      <Button type="button" variant={!isBroadcast ? 'default' : 'outline'} size="sm" className={!isBroadcast ? 'glass-button' : 'border-purple-500/20 text-zinc-300'} onClick={() => setIsBroadcast(false)}>
                        <Mail className="w-4 h-4 mr-1" />Privé
                      </Button>
                    </div>

                    {!isBroadcast && (
                      <select value={selectedRecipient} onChange={(e) => setSelectedRecipient(e.target.value)} className="w-full h-10 rounded-md bg-white/5 border border-purple-500/20 text-white px-3">
                        <option value="">Sélectionner un destinataire</option>
                        {[...data.admins, ...data.affiliates].map((u) => (
                          <option key={u.id} value={u.id}>{u.full_name || u.email} ({u.role})</option>
                        ))}
                      </select>
                    )}

                    <Input placeholder="Sujet" value={messageSubject} onChange={(e) => setMessageSubject(e.target.value)} className="bg-white/5 border-purple-500/20 text-white" />
                    <Textarea placeholder="Message..." value={messageContent} onChange={(e) => setMessageContent(e.target.value)} rows={6} className="bg-white/5 border-purple-500/20 text-white resize-none" />
                    <Button type="submit" disabled={isSending} className="w-full glass-button">
                      {isSending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                      {isBroadcast ? 'Envoyer à tous' : 'Envoyer'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="glass-card border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white flex items-center gap-2 text-lg">
                    <MessageSquare className="w-5 h-5 text-purple-400" />
                    Messages envoyés
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-96 overflow-y-auto custom-scrollbar">
                    {data.messages.length === 0 ? (
                      <div className="text-center py-8 text-zinc-500">
                        <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p>Aucun message</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {data.messages.map((msg) => (
                          <div key={msg.id} className="p-3 rounded-lg bg-white/5 border border-purple-500/10">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-white font-medium text-sm">{msg.subject}</span>
                              <Badge className={msg.is_broadcast ? 'bg-purple-500/10 text-purple-300' : 'bg-blue-500/10 text-blue-300'}>
                                {msg.is_broadcast ? 'Tous' : 'Privé'}
                              </Badge>
                            </div>
                            <p className="text-zinc-400 text-sm line-clamp-2">{msg.content}</p>
                            <p className="text-zinc-500 text-xs mt-2">{formatDate(msg.created_at)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="max-w-xl">
              <Card className="glass-card border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white flex items-center gap-2 text-lg">
                    <Lock className="w-5 h-5 text-purple-400" />
                    Changer le mot de passe Super Admin
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                      <Label className="text-zinc-300">Mot de passe actuel</Label>
                      <Input type="password" value={adminPassword.current} onChange={(e) => setAdminPassword({ ...adminPassword, current: e.target.value })} className="bg-white/5 border-purple-500/20 text-white" required />
                    </div>
                    <div>
                      <Label className="text-zinc-300">Nouveau mot de passe</Label>
                      <Input type="password" value={adminPassword.new} onChange={(e) => setAdminPassword({ ...adminPassword, new: e.target.value })} className="bg-white/5 border-purple-500/20 text-white" required minLength={6} />
                    </div>
                    <div>
                      <Label className="text-zinc-300">Confirmer</Label>
                      <Input type="password" value={adminPassword.confirm} onChange={(e) => setAdminPassword({ ...adminPassword, confirm: e.target.value })} className="bg-white/5 border-purple-500/20 text-white" required minLength={6} />
                    </div>
                    <Button type="submit" disabled={isChangingPassword} className="w-full glass-button">
                      {isChangingPassword ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Key className="w-4 h-4 mr-2" />}
                      Changer le mot de passe
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(168, 85, 247, 0.05); border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(168, 85, 247, 0.3); border-radius: 3px; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>
    </div>
  )
}
