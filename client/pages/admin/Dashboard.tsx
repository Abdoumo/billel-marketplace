import { AdminLayout } from "@/components/layout/AdminLayout";
import { useEffect, useState } from "react";
import { getAccessToken } from "@/lib/auth";
import {
  Users,
  LayoutList,
  Banknote,
  ShoppingBag,
  TrendingUp,
  ArrowUpRight,
  Loader2,
  ClipboardCheck,
  FileWarning,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Stats {
  activeListings: number;
  totalUsers: number;
  totalTransactions: number;
  totalRevenue: number;
}

const quickLinks = [
  {
    href: "/admin/orders",
    label: "All Orders",
    desc: "View and track all platform transactions",
    icon: ShoppingBag,
    gradient: "from-blue-500 to-blue-700",
    glow: "shadow-blue-500/20",
  },
  {
    href: "/admin/users",
    label: "Manage Users",
    desc: "View accounts, assign roles, manage verification badges",
    icon: Users,
    gradient: "from-violet-500 to-violet-700",
    glow: "shadow-violet-500/20",
  },
  {
    href: "/admin/listings",
    label: "Moderate Listings",
    desc: "Review pending listings and approve or reject them",
    icon: LayoutList,
    gradient: "from-amber-500 to-orange-600",
    glow: "shadow-amber-500/20",
  },
  {
    href: "/admin/kyc",
    label: "KYC Queue",
    desc: "Review pending KYC documents from sellers",
    icon: ClipboardCheck,
    gradient: "from-emerald-500 to-teal-600",
    glow: "shadow-emerald-500/20",
  },
  {
    href: "/admin/reports",
    label: "Reports",
    desc: "Handle user reports about listings and conduct",
    icon: FileWarning,
    gradient: "from-rose-500 to-pink-600",
    glow: "shadow-rose-500/20",
  },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = getAccessToken();
        const res = await fetch("/api/admin/stats", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            navigate("/auth/login");
            return;
          }
          throw new Error("Failed to load admin stats");
        }
        setStats(await res.json());
      } catch (err: any) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [navigate]);

  const statCards = stats
    ? [
        {
          label: "Active Listings",
          value: stats.activeListings,
          icon: LayoutList,
          color: "text-blue-600",
          bg: "bg-blue-500/10",
          change: "+12% this week",
        },
        {
          label: "Total Users",
          value: stats.totalUsers.toLocaleString(),
          icon: Users,
          color: "text-violet-600",
          bg: "bg-violet-500/10",
          change: "+8% this week",
        },
        {
          label: "Transactions",
          value: stats.totalTransactions,
          icon: ShoppingBag,
          color: "text-amber-600",
          bg: "bg-amber-500/10",
          change: "+5% this week",
        },
        {
          label: "Total Revenue",
          value: `${stats.totalRevenue.toLocaleString()} DA`,
          icon: Banknote,
          color: "text-emerald-600",
          bg: "bg-emerald-500/10",
          change: "+18% this month",
        },
      ]
    : [];

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-black">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Platform overview — manage every aspect of AssetHub from here
        </p>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
            {statCards.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.label}
                  className="rounded-2xl border border-border bg-card p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`h-10 w-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                      <Icon className={`h-5 w-5 ${s.color}`} />
                    </div>
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                  </div>
                  <p className="text-3xl font-black">{s.value}</p>
                  <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
                  <p className="text-xs text-emerald-600 font-medium mt-2">{s.change}</p>
                </div>
              );
            })}
          </div>

          {/* Quick access cards */}
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-4">Quick Access</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <button
                    key={link.href}
                    onClick={() => navigate(link.href)}
                    className={`group text-left rounded-2xl border border-border bg-card p-6 hover:border-transparent hover:shadow-xl ${link.glow} transition-all duration-300`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${link.gradient} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}
                      >
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <h3 className="font-bold text-base mb-1">{link.label}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{link.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
