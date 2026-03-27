import Link from "next/link";
import { StarryBackground } from "@/components/starry-background";
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
          <span className="text-xl font-bold gradient-text">Affiliation Pro</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <Link href="#features" className="text-zinc-400 hover:text-white transition-colors">
            Fonctionnalités
          </Link>
          <Link href="#pricing" className="text-zinc-400 hover:text-white transition-colors">
            Tarifs
          </Link>
          <Link href="#faq" className="text-zinc-400 hover:text-white transition-colors">
            FAQ
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
              Démarrer gratuit
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-6 pt-16 pb-24 md:px-12 lg:px-24">
        <div className="max-w-6xl mx-auto text-center">
          <Badge className="mb-6 glass-button border-purple-500/30 text-purple-300">
            <Sparkles className="w-3 h-3 mr-1" />
            Nouveau: Intégration Systeme.io
          </Badge>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            <span className="text-white">Programme d'Affiliation</span>
            <br />
            <span className="gradient-text">3 Niveaux de Commissions</span>
          </h1>
          
          <p className="text-lg md:text-xl text-zinc-400 mb-8 max-w-2xl mx-auto">
            La plateforme premium qui remplace l'affiliation Systeme.io. 
            Gagnez <span className="text-purple-400 font-semibold">25%</span> + 
            <span className="text-blue-400 font-semibold"> 10%</span> + 
            <span className="text-green-400 font-semibold"> 5%</span> sur 3 niveaux.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link href="/signup">
              <Button size="lg" className="glass-button text-white border-0 px-8 py-6 text-lg group">
                Commencer gratuitement
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="#demo">
              <Button size="lg" variant="outline" className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10">
                Voir la démo
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
            {[
              { value: "2,847+", label: "Affiliés actifs" },
              { value: "€127K", label: "Commissions versées" },
              { value: "99.9%", label: "Uptime garanti" },
            ].map((stat, i) => (
              <div key={i} className="glass-card rounded-2xl p-4">
                <div className="text-2xl md:text-3xl font-bold gradient-text">{stat.value}</div>
                <div className="text-sm text-zinc-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Hero Visual */}
        <div className="max-w-5xl mx-auto mt-16">
          <div className="glass-card rounded-3xl p-2 glow-purple">
            <div className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 rounded-2xl p-8 min-h-[400px] flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center pulse-glow">
                  <TrendingUp className="w-12 h-12 text-white" />
                </div>
                <p className="text-xl text-zinc-300">Dashboard Preview</p>
                <p className="text-sm text-zinc-500 mt-2">Interface premium en cours de chargement...</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 px-6 py-24 md:px-12 lg:px-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Pourquoi choisir <span className="gradient-text">Affiliation Pro</span> ?
            </h2>
            <p className="text-zinc-400 max-w-xl mx-auto">
              La solution complète pour les entrepreneurs qui veulent maximiser leurs revenus d'affiliation.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Gift,
                title: "3 Niveaux de Commissions",
                description: "25% au niveau 1, 10% au niveau 2, 5% au niveau 3. Gagnez sur les ventes de vos filleuls et leurs filleuls.",
              },
              {
                icon: Zap,
                title: "Intégration Systeme.io",
                description: "Connectez votre compte Systeme.io en un clic. Webhooks automatiques pour le tracking des ventes.",
              },
              {
                icon: Users,
                title: "Programme Ambassadeur",
                description: "Devenez ambassadeur et touchez des commissions récurrentes chaque mois sur vos referrals.",
              },
              {
                icon: TrendingUp,
                title: "Analytics Avancés",
                description: "Suivez vos performances en temps réel. Visualisez vos gains, clics, conversions et tendances.",
              },
              {
                icon: Shield,
                title: "Paiements Sécurisés",
                description: "Retraits automatiques vers PayPal ou virement bancaire. Transactions cryptées et sécurisées.",
              },
              {
                icon: Sparkles,
                title: "IA Intégrée",
                description: "Assistant IA pour générer vos contenus promotionnels, emails et pages de vente optimisées.",
              },
            ].map((feature, i) => (
              <Card key={i} className="glass-card glass-card-hover border-0">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-zinc-400 text-sm">{feature.description}</p>
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
              Comment ça <span className="gradient-text">fonctionne</span> ?
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Créez votre compte",
                description: "Inscription gratuite en 30 secondes. Vous recevez immédiatement votre lien d'affiliation unique.",
              },
              {
                step: "02",
                title: "Partagez votre lien",
                description: "Partagez votre lien sur vos réseaux, blog, email. Notre IA peut générer du contenu pour vous.",
              },
              {
                step: "03",
                title: "Gagnez des commissions",
                description: "Recevez 25% sur chaque vente + 10% sur les filleuls de niveau 2 + 5% sur le niveau 3.",
              },
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="glass-card rounded-2xl p-6 h-full">
                  <div className="text-4xl font-bold gradient-text mb-4">{item.step}</div>
                  <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-zinc-400">{item.description}</p>
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
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Tarification <span className="gradient-text">simple</span>
            </h2>
            <p className="text-zinc-400">Un seul plan. Toutes les fonctionnalités. Sans surprise.</p>
          </div>

          <div className="glass-card rounded-3xl p-8 glow-purple">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div>
                <Badge className="mb-4 bg-purple-500/20 text-purple-300 border-purple-500/30">
                  Populaire
                </Badge>
                <h3 className="text-2xl font-bold text-white mb-2">Affiliation Pro</h3>
                <p className="text-zinc-400 mb-6">Accès complet à toutes les fonctionnalités</p>
                <ul className="space-y-3">
                  {[
                    "Programme 3 niveaux illimité",
                    "Intégration Systeme.io",
                    "Analytics en temps réel",
                    "Assistant IA inclus",
                    "Support prioritaire",
                    "Paiements automatiques",
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-zinc-300">
                      <Check className="w-5 h-5 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="text-center md:text-right">
                <div className="text-5xl font-bold gradient-text mb-2">39€</div>
                <div className="text-zinc-400 mb-6">/mois</div>
                <Link href="/signup">
                  <Button size="lg" className="glass-button text-white border-0 px-8">
                    Commencer maintenant
                  </Button>
                </Link>
                <p className="text-xs text-zinc-500 mt-4">Essai gratuit 14 jours • Sans engagement</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 py-24 md:px-12 lg:px-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="glass-card rounded-3xl p-12">
            <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Prêt à rejoindre les <span className="gradient-text">Affiliés Pro</span> ?
            </h2>
            <p className="text-zinc-400 mb-8 max-w-xl mx-auto">
              Rejoignez les milliers d'entrepreneurs qui génèrent des revenus passifs avec notre programme d'affiliation 3 niveaux.
            </p>
            <Link href="/signup">
              <Button size="lg" className="glass-button text-white border-0 px-12 py-6 text-lg group">
                Créer mon compte gratuit
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-12 md:px-12 lg:px-24 border-t border-purple-500/10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white">Affiliation Pro</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-zinc-400">
              <Link href="/privacy" className="hover:text-white transition-colors">Confidentialité</Link>
              <Link href="/terms" className="hover:text-white transition-colors">CGU</Link>
              <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
            </div>
            <div className="text-sm text-zinc-500">
              © 2024 Affiliation Pro. Tous droits réservés.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
