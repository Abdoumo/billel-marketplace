import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  TrendingUp,
  Lock,
  Zap,
  CheckCircle2,
  ArrowRight,
  Shield,
  Headphones,
  Star,
  Users,
  BarChart3,
  Globe,
} from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Bank-Grade Security",
    description:
      "Military-grade encryption protects all your transactions and personal information at every step.",
    gradient: "from-blue-500 to-blue-700",
    glow: "group-hover:shadow-blue-500/25",
  },
  {
    icon: CheckCircle2,
    title: "Verified Listings",
    description:
      "Every listing is professionally verified to ensure authenticity and quality before going live.",
    gradient: "from-purple-500 to-purple-700",
    glow: "group-hover:shadow-purple-500/25",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description:
      "Complete transactions in minutes with instant settlements and real-time confirmations.",
    gradient: "from-amber-500 to-orange-600",
    glow: "group-hover:shadow-orange-500/25",
  },
  {
    icon: TrendingUp,
    title: "Real-Time Analytics",
    description:
      "Track market trends and your portfolio performance with detailed, actionable insights.",
    gradient: "from-emerald-500 to-teal-600",
    glow: "group-hover:shadow-emerald-500/25",
  },
  {
    icon: Lock,
    title: "Legal Protection",
    description:
      "Access professional notaries and lawyers for fully compliant, legally-protected transactions.",
    gradient: "from-rose-500 to-pink-600",
    glow: "group-hover:shadow-rose-500/25",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description:
      "Our dedicated expert support team is always ready to assist with any questions or issues.",
    gradient: "from-sky-500 to-cyan-600",
    glow: "group-hover:shadow-cyan-500/25",
  },
];

const steps = [
  {
    num: "01",
    title: "Sign Up",
    desc: "Create your account in seconds with email or social login",
    icon: Users,
  },
  {
    num: "02",
    title: "Verify",
    desc: "Complete KYC verification to unlock buying and selling",
    icon: CheckCircle2,
  },
  {
    num: "03",
    title: "Browse",
    desc: "Explore thousands of verified digital assets and listings",
    icon: Globe,
  },
  {
    num: "04",
    title: "Trade",
    desc: "Complete transactions securely with legal protections",
    icon: BarChart3,
  },
];

const testimonials = [
  {
    name: "Sarah K.",
    role: "SaaS Founder",
    text: "AssetHub made selling my startup incredibly smooth. The verification process gave buyers confidence and we closed in record time.",
    stars: 5,
    avatar: "SK",
  },
  {
    name: "Marcus T.",
    role: "Angel Investor",
    text: "The best platform for discovering early-stage equity. The analytics tools help me evaluate deals like a pro.",
    stars: 5,
    avatar: "MT",
  },
  {
    name: "Lina R.",
    role: "Domain Trader",
    text: "I've sold over 30 premium domains here. The escrow system is rock-solid and support is incredibly fast.",
    stars: 5,
    avatar: "LR",
  },
];

export default function Home() {
  return (
    <Layout>
      {/* ═══════════════════════════════════════════════ HERO ══ */}
      <section className="relative overflow-hidden pt-20 pb-32 sm:pt-32 sm:pb-48">
        {/* Ambient blobs */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-32 right-0 h-[600px] w-[600px] rounded-full bg-primary/10 blur-[120px]" />
          <div className="absolute bottom-0 -left-32 h-[500px] w-[500px] rounded-full bg-secondary/10 blur-[100px]" />
          <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/5 blur-[80px]" />
        </div>

        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* ── Left Content ── */}
            <div className="space-y-8">
              {/* Pill badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-2 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                </span>
                <span className="text-sm font-semibold text-primary">
                  The Modern Digital Marketplace
                </span>
              </div>

              <div className="space-y-5">
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05]">
                  Trade Digital Assets
                  <br />
                  <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                    with Confidence
                  </span>
                </h1>

                <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
                  Buy, sell, and evaluate startup equity, digital assets, and
                  business listings with professional verification and full
                  legal protection.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/auth/register">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-105 transition-all duration-200"
                  >
                    Get Started Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/marketplace">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto hover:bg-primary/5 hover:border-primary/50 transition-all duration-200"
                  >
                    Browse Listings
                  </Button>
                </Link>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-6 pt-4 border-t border-border">
                {[
                  { value: "2,400+", label: "Active Listings" },
                  { value: "15K+", label: "Verified Users" },
                  { value: "$500M+", label: "Total Traded" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                      {stat.value}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Right Visual ── */}
            <div className="relative hidden lg:flex items-center justify-center">
              {/* Decorative ring */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/10 blur-2xl" />

              {/* Main image card */}
              <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-primary/20 ring-1 ring-primary/20 w-full max-w-lg">
                <img
                  src="/hero_marketplace.png"
                  alt="AssetHub Digital Marketplace Dashboard"
                  className="w-full h-auto object-cover"
                />

                {/* Floating metric cards overlaid on top of the image */}
                <div className="absolute top-4 left-4 flex items-center gap-2 rounded-2xl bg-card/90 backdrop-blur-md border border-border px-4 py-2.5 shadow-lg">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">
                      Today's Volume
                    </p>
                    <p className="text-sm font-bold text-foreground">
                      $2.4M
                    </p>
                  </div>
                </div>

                <div className="absolute bottom-4 right-4 flex items-center gap-2 rounded-2xl bg-card/90 backdrop-blur-md border border-border px-4 py-2.5 shadow-lg">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">
                      Verified Listings
                    </p>
                    <p className="text-sm font-bold text-foreground">2,400+</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ FEATURES ══ */}
      <section className="py-24 sm:py-36 border-t border-border relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-secondary/5 blur-3xl" />
        </div>

        <div className="container">
          <div className="text-center space-y-4 mb-20">
            <div className="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/5 px-4 py-2">
              <span className="text-sm font-semibold text-secondary">
                Why AssetHub?
              </span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
              Built for Serious Traders
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We built AssetHub for entrepreneurs and investors who demand
              security, transparency, and efficiency.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className={`group relative rounded-2xl border border-border bg-card p-8 hover:border-transparent transition-all duration-300 hover:shadow-2xl ${feature.glow}`}
                >
                  {/* Hover gradient overlay */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                  <div
                    className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════ HOW IT WORKS ══ */}
      <section className="py-24 sm:py-36 bg-card border-t border-border relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="container">
          <div className="text-center space-y-4 mb-20">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/5 px-4 py-2">
              <span className="text-sm font-semibold text-accent">
                Simple Process
              </span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get started in four simple steps and make your first trade today
            </p>
          </div>

          {/* Steps */}
          <div className="relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-10 left-[calc(12.5%+28px)] right-[calc(12.5%+28px)] h-px bg-gradient-to-r from-primary/30 via-secondary/30 to-accent/30" />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
              {steps.map((step, idx) => {
                const Icon = step.icon;
                const colors = [
                  "from-primary to-blue-600",
                  "from-secondary to-purple-700",
                  "from-accent to-orange-500",
                  "from-emerald-500 to-teal-600",
                ];
                return (
                  <div
                    key={step.num}
                    className="flex flex-col items-center text-center group"
                  >
                    <div className="relative mb-6">
                      <div
                        className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${colors[idx]} flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300`}
                      >
                        <Icon className="h-9 w-9 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-background border-2 border-primary flex items-center justify-center text-[10px] font-black text-primary">
                        {idx + 1}
                      </div>
                    </div>
                    <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════ TESTIMONIALS ══ */}
      <section className="py-24 sm:py-36 border-t border-border relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute top-1/2 left-0 h-96 w-96 -translate-y-1/2 rounded-full bg-secondary/5 blur-3xl" />
        </div>

        <div className="container">
          <div className="text-center space-y-4 mb-20">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-2">
              <Star className="h-4 w-4 fill-primary text-primary" />
              <span className="text-sm font-semibold text-primary">
                Trusted by Thousands
              </span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
              What Our Users Say
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="relative rounded-2xl border border-border bg-card p-8 hover:border-primary/30 hover:shadow-xl transition-all duration-300 group"
              >
                {/* Stars */}
                <div className="flex gap-1 mb-5">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>

                <p className="text-muted-foreground leading-relaxed mb-6 text-sm">
                  "{t.text}"
                </p>

                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════ CTA ══ */}
      <section className="py-24 sm:py-36 border-t border-border">
        <div className="container">
          <div className="relative overflow-hidden rounded-3xl">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-secondary to-accent opacity-90" />

            {/* Pattern overlay */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] bg-[size:32px_32px]" />

            {/* Blobs */}
            <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

            <div className="relative px-8 sm:px-16 py-20 sm:py-28 text-center text-white">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 mb-8 backdrop-blur-sm">
                <Zap className="h-4 w-4 fill-white text-white" />
                <span className="text-sm font-semibold">
                  Start for free — no credit card required
                </span>
              </div>

              <h2 className="text-4xl sm:text-6xl font-black mb-6 leading-tight">
                Ready to Start Trading?
              </h2>
              <p className="text-lg sm:text-xl opacity-90 mb-10 max-w-2xl mx-auto leading-relaxed">
                Join thousands of successful traders and investors on AssetHub.
                Your next big deal is one click away.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/auth/register">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-white text-primary hover:bg-white/90 font-bold shadow-xl hover:scale-105 transition-all duration-200 px-8"
                  >
                    Create Free Account
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/marketplace">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto border-white/40 text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm font-semibold px-8"
                  >
                    Browse Marketplace
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
