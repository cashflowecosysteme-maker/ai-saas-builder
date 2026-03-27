import Link from "next/link";
import Image from "next/image";
import { StarryBackground } from "@/components/starry-background";
import { LogoSlider } from "@/components/logo-slider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Sparkles,
  Users,
  TrendingUp,
  Shield,
  Zap,
  Gift,
  ChevronRight,
  Check,
  BarChart3,
  Link2,
  Mail,
  LayoutDashboard,
  Settings,
  Crown,
  Heart,
} from "lucide-react";

export default function Home() {
  return (
    <div className="relative min-h-screen">
      <StarryBackground />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 md:px-12 lg:px-24">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold gradient-text">AffiliationPro</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <Link href="#features" className="text-zinc-400 hover:text-white transition-colors">
            Fonctionnalités
          </Link>
          <Link href="#pricing" className="text-zinc-400 hover:text-white transition-colors">
            Tarifs
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost" className="text-zinc-400 hover:text-white">
              Connexion
            </Button>
          </Link>
          <Link href="/signup">
            <Button className="glass-button text-white border-0">
              Essai gratuit
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-6 pt-16 pb-24 md:px-12 lg:px-24">
        <div className="max-w-6xl mx-auto text-center">
          <Badge className="mb-6 glass-button border-purple-500/30 text-purple-300">
            🚀 Alternative à l'affiliation Systeme.io
          </Badge>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            <span className="text-white">Ton programme d'affiliation</span>
            <br />
            <span className="gradient-text">prêt en 5 minutes</span>
          </h1>
          
          <p className="text-lg md:text-xl text-zinc-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Tu utilises Systeme.io ? Leur système d'affiliation a fermé ? 
            <span className="text-purple-400 font-semibold"> Crée ton propre programme d'affiliation avec 3 niveaux de commissions, dashboard complet et automatisation totale.</span>
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link href="/signup">
              <Button size="lg" className="glass-button text-white border-0 px-8 py-6 text-lg group">
                Essai gratuit (7 jours)
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Done For You Section */}
      <section className="relative z-10 px-6 py-12 md:px-12 lg:px-24">
        <div className="max-w-6xl mx-auto">
          <div className="glass-card rounded-3xl p-8 md:p-12 border border-green-500/30 bg-gradient-to-br from-green-500/5 via-transparent to-emerald-500/5">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              {/* Image */}
              <div className="w-full lg:w-1/2 flex justify-center">
                <div className="relative w-full max-w-md aspect-[3/2] rounded-2xl overflow-hidden border-2 border-green-500/20 shadow-2xl shadow-green-500/10">
                  <Image
                    src="/heureuse.png"
                    alt="Femme heureuse - Done For You"
                    fill
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-900/30 to-transparent" />
                </div>
              </div>
              
              {/* Content */}
              <div className="w-full lg:w-1/2 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30">
                  <Crown className="w-5 h-5 text-green-400" />
                  <span className="text-green-300 font-semibold">100% Done For You</span>
                </div>
                
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  <span className="text-green-400">Zéro Technique.</span>
                  <br />
                  <span className="text-green-400">Zéro Effort.</span>
                  <br />
                  <span className="gradient-text">Zéro Stress.</span>
                </h2>
                
                <p className="text-zinc-300 text-lg mb-6 leading-relaxed">
                  Tu paies. Tu cliques. <span className="text-green-400 font-semibold">L'IA fait tout le reste</span> pendant que tu profites de ta vie.
                </p>
                
                <div className="space-y-3 mb-6">
                  {[
                    "Ton employé numérique 24h/24 et 7j/7",
                    "L'IA travaille pendant que tu dors",
                    "Tu te réveilles avec des résultats",
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 justify-center lg:justify-start">
                      <Heart className="w-5 h-5 text-pink-400 fill-pink-400" />
                      <span className="text-zinc-300">{item}</span>
                    </div>
                  ))}
                </div>
                
                <p className="text-zinc-400 text-sm italic">
                  "Je paie, je clic, c'est fait. Je ne réfléchis plus." ✨
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Logo Slider - Trust Section */}
      <LogoSlider />

      {/* Features Section */}
      <section id="features" className="relative z-10 px-6 py-24 md:px-12 lg:px-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              ✨ Tout ce dont tu as besoin
            </h2>
            <p className="text-zinc-400 max-w-xl mx-auto">
              Une solution complète pour gérer ton programme d'affiliation
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: BarChart3,
                title: "3 Niveaux de Commissions",
                description: "Niveau 1 : 25% • Niveau 2 : 10% • Niveau 3 : 5% (ou personnalise selon tes besoins). Motive tes affiliés à recruter d'autres affiliés !",
                color: "text-purple-400",
              },
              {
                icon: Link2,
                title: "Intégration Systeme.io",
                description: "Connecte ton compte Systeme.io en 1 clic. Chaque vente est automatiquement trackée et les commissions calculées.",
                color: "text-blue-400",
              },
              {
                icon: LayoutDashboard,
                title: "Page d'Inscription Pro",
                description: "Une page d'inscription personnalisée pour recruter tes affiliés automatiquement. Ton branding, ton style.",
                color: "text-green-400",
              },
              {
                icon: TrendingUp,
                title: "Dashboard Affiliés",
                description: "Tes affiliés voient leurs ventes, leur équipe, leurs gains, leurs liens personnalisés. Tout est clair et motivant.",
                color: "text-orange-400",
              },
              {
                icon: Settings,
                title: "Dashboard Admin",
                description: "Gère tes affiliés, visualise les statistiques, exporte les données, effectue les paiements en quelques clics.",
                color: "text-pink-400",
              },
              {
                icon: Mail,
                title: "Emails Automatiques",
                description: "Bienvenue aux affiliés, notification de vente, récapitulatif mensuel... Tout est automatisé.",
                color: "text-cyan-400",
              },
            ].map((feature, i) => (
              <Card key={i} className="glass-card glass-card-hover border-0">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center mb-4">
                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="relative z-10 px-6 py-24 md:px-12 lg:px-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              🚀 Comment ça <span className="gradient-text">marche</span> ?
            </h2>
            <p className="text-zinc-400">En 3 étapes simples, ton programme est prêt</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Crée ton compte",
                description: "Inscription gratuite en 30 secondes. Tu configures ton programme : nom, logo, pourcentages de commissions.",
              },
              {
                step: "2",
                title: "Connecte Systeme.io",
                description: "Tu colles ton webhook Systeme.io et c'est tout ! Les ventes sont automatiquement trackées.",
              },
              {
                step: "3",
                title: "Recrute tes affiliés",
                description: "Partage ta page d'inscription. Tes affiliés s'inscrivent, reçoivent leurs liens et commencent à vendre pour toi !",
              },
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="glass-card rounded-2xl p-6 h-full">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center mb-4 text-white font-bold text-xl">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-zinc-400 leading-relaxed">{item.description}</p>
                </div>
                {i < 2 && (
                  <ChevronRight className="hidden md:block absolute top-1/2 -right-6 w-8 h-8 text-purple-500/50 transform -translate-y-1/2" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative z-10 px-6 py-24 md:px-12 lg:px-24">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              <span className="gradient-text">39 $</span> par mois
            </h2>
            <p className="text-zinc-400">Pour les entreprises en croissance</p>
          </div>

          <Card className="glass-card rounded-3xl p-8 glow-purple">
            <CardContent className="p-0">
              <ul className="space-y-4 mb-8">
                {[
                  "3 niveaux de commissions",
                  "Affiliés illimités",
                  "Marque blanche",
                  "Dashboard ultra-complet",
                  "API + Webhooks multiples",
                  "Emails avancés",
                  "Support prioritaire",
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-zinc-300">
                    <Check className="w-5 h-5 text-green-500 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              
              <Link href="/signup" className="block">
                <Button size="lg" className="w-full glass-button text-white border-0 py-6 text-lg group">
                  Démarrer maintenant
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* PublicationCashflow - Flagship Product */}
      <section className="relative z-10 px-6 py-24 md:px-12 lg:px-24">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card rounded-3xl p-8 md:p-12 border border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-transparent to-purple-500/5">
            <Badge className="mb-4 bg-amber-500/20 text-amber-300 border-amber-500/30">
              👑 Notre Solution Premium
            </Badge>
            
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              <span className="text-amber-400">PublicationCashflow</span>
            </h2>
            
            <p className="text-xl text-zinc-200 mb-4 font-medium">
              L'IA crée ton site d'affiliation en <span className="text-amber-400">60 secondes</span>.
            </p>
            
            <p className="text-zinc-400 mb-6 text-lg">
              Puis elle publie <span className="text-white font-semibold">automatiquement du contenu 24h/24 et 7j/7</span>...
            </p>
            
            {/* Done For You Banner */}
            <div className="mb-8 p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 text-center">
              <p className="text-green-400 font-semibold text-lg mb-1">
                ✨ 100% Done For You — Zéro Technique, Zéro Stress
              </p>
              <p className="text-zinc-400 text-sm">
                Tu paies. Tu cliques. L'IA fait tout le reste pendant que tu profites de ta vie.
              </p>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { icon: "⚡", text: "Génération en 60 sec" },
                { icon: "🤖", text: "Contenu automatisé 24/7" },
                { icon: "📘", text: "Intégration Facebook..." },
                { icon: "📅", text: "Et bien plus encore..." },
              ].map((item, i) => (
                <div key={i} className="text-center p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <p className="text-zinc-300 text-sm">{item.text}</p>
                </div>
              ))}
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
              <div>
                <p className="text-zinc-300 text-lg font-medium">Découvre ce que l'IA peut faire pour toi...</p>
                <p className="text-amber-400 text-sm">👉 Ton employé numérique qui travaille pendant que tu dors...</p>
              </div>
              <a href="https://www.publicationcashflow.com/" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                <Button size="lg" className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 group">
                  Voir la démo
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Coming Soon - Création Sites IA */}
      <section className="relative z-10 px-6 py-24 md:px-12 lg:px-24 bg-gradient-to-b from-transparent via-purple-900/10 to-transparent">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card rounded-3xl p-8 md:p-12 border border-purple-500/30">
            <Badge className="mb-4 bg-purple-500/20 text-purple-300 border-purple-500/30">
              🚀 Bientôt disponible
            </Badge>
            
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Création de <span className="gradient-text">Sites IA Premium</span>
            </h2>
            
            <p className="text-zinc-300 mb-6 text-lg">
              Tu connais notre <span className="text-purple-400 font-semibold">Générateur d'affiliation</span> ?
              On pousse le concept encore plus loin !
            </p>
            
            <p className="text-zinc-400 mb-8">
              <span className="text-white font-medium">Mini-sites premium</span> pour coachs, thérapeutes, freelancers, ambassadeurs, 
              numérologues, astrologues, et tous les entrepreneurs du bien-être...
            </p>
            
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {[
                "🎨 10+ templates professionnels",
                "🤖 Génération IA illimitée",
                "🔗 Sous-domaine inclus",
                "📱 Carte numérique d'affaire",
                "💼 Portfolio & services",
                "📅 Prise de rendez-vous",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-zinc-300">
                  <Check className="w-4 h-4 text-green-400 shrink-0" />
                  <span>{item.substring(2)}</span>
                </div>
              ))}
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 rounded-2xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20">
              <div>
                <p className="text-zinc-400 text-sm">Prix de lancement</p>
                <p className="text-4xl font-bold gradient-text">69 <span className="text-xl">$</span></p>
                <p className="text-zinc-500 text-sm">par mois</p>
              </div>
              <div className="flex flex-col gap-3 w-full sm:w-auto">
                <Button size="lg" className="glass-button text-white border-0 group">
                  🔔 Rejoindre la liste d'attente
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <p className="text-xs text-zinc-500 text-center">Sois informé(e) en premier !</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 py-24 md:px-12 lg:px-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="glass-card rounded-3xl p-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              💜 Prêt(e) à lancer ton <span className="gradient-text">programme d'affiliation</span> ?
            </h2>
            <p className="text-zinc-400 mb-8 max-w-xl mx-auto">
              Rejoins les entrepreneurs qui utilisent AffiliationPro pour automatiser leurs ventes. 
              Essai gratuit de 7 jours, sans carte de crédit.
            </p>
            <Link href="/signup">
              <Button size="lg" className="glass-button text-white border-0 px-12 py-6 text-lg group">
                🚀 Démarrer mon essai gratuit
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-8 md:px-12 lg:px-24 border-t border-purple-500/10">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-zinc-500 text-sm">
            © 2026 AffiliationPro - Un service Publication-Web Cashflow • Visionnaire depuis 1997 ✨
          </p>
        </div>
      </footer>
    </div>
  );
}
