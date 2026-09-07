import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import {
  Search,
  MapPin,
  Star,
  Shield,
  Phone,
  Mail,
  ChevronDown,
  Loader2,
  Scale,
  ArrowLeft,
  BadgeCheck,
  Briefcase,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// ── Types ───────────────────────────────────────────────────────────────────
interface NotaryProfile {
  id: string;
  wilaya: string;
  specialization: string | null;
  officialNumber: string;
  isVerified: boolean;
  rating: number;
  totalTransactions: number;
  subscriptionStatus: string;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    phone: string | null;
    avatar: string | null;
    isVerifiedBadge: boolean;
  };
}

// ── Algerian Wilayas ─────────────────────────────────────────────────────────
const WILAYAS = [
  "Adrar", "Chlef", "Laghouat", "Oum El Bouaghi", "Batna", "Béjaïa",
  "Biskra", "Béchar", "Blida", "Bouira", "Tamanrasset", "Tébessa",
  "Tlemcen", "Tiaret", "Tizi Ouzou", "Alger", "Djelfa", "Jijel",
  "Sétif", "Saïda", "Skikda", "Sidi Bel Abbès", "Annaba", "Guelma",
  "Constantine", "Médéa", "Mostaganem", "M'Sila", "Mascara", "Ouargla",
  "Oran", "El Bayadh", "Illizi", "Bordj Bou Arréridj", "Boumerdès",
  "El Tarf", "Tindouf", "Tissemsilt", "El Oued", "Khenchela",
  "Souk Ahras", "Tipaza", "Mila", "Aïn Defla", "Naâma", "Aïn Témouchent",
  "Ghardaïa", "Relizane",
];

const SPECIALIZATIONS = [
  "Real Estate",
  "Business Transfers",
  "Inheritance",
  "Marriage Contracts",
  "Corporate Law",
  "Digital Assets",
  "General Notary",
];

// ── Star Rating ──────────────────────────────────────────────────────────────
function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              "h-3.5 w-3.5",
              star <= Math.round(rating)
                ? "fill-amber-400 text-amber-400"
                : "fill-muted text-muted"
            )}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">
        {rating.toFixed(1)} ({count} transactions)
      </span>
    </div>
  );
}

// ── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({
  firstName,
  lastName,
  avatar,
}: {
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
}) {
  const initials =
    `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "?";
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={initials}
        className="h-14 w-14 rounded-full object-cover border-2 border-primary/20"
      />
    );
  }
  return (
    <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary/80 to-secondary/80 flex items-center justify-center text-white font-bold text-lg border-2 border-primary/20">
      {initials}
    </div>
  );
}

// ── Notary Card ──────────────────────────────────────────────────────────────
function NotaryCard({ notary }: { notary: NotaryProfile }) {
  const name =
    [notary.user.firstName, notary.user.lastName].filter(Boolean).join(" ") ||
    "Notary";

  return (
    <div className="group rounded-2xl border bg-card hover:border-primary/40 hover:shadow-lg transition-all duration-200 overflow-hidden">
      {/* Accent stripe */}
      <div className="h-1 w-full bg-gradient-to-r from-primary to-secondary" />

      <div className="p-5">
        {/* Top row */}
        <div className="flex items-start gap-3">
          <div className="relative shrink-0">
            <Avatar
              firstName={notary.user.firstName}
              lastName={notary.user.lastName}
              avatar={notary.user.avatar}
            />
            {notary.isVerified && (
              <BadgeCheck className="absolute -bottom-1 -right-1 h-5 w-5 text-primary bg-background rounded-full" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-sm truncate">{name}</h3>
              {notary.isVerified && (
                <Badge className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20 h-4">
                  Verified
                </Badge>
              )}
              {notary.subscriptionStatus === "ACTIVE" && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 border-emerald-200 text-emerald-700 bg-emerald-50 h-4"
                >
                  Active
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-1 mt-0.5 text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="text-xs truncate">{notary.wilaya}</span>
            </div>

            <StarRating
              rating={notary.rating}
              count={notary.totalTransactions}
            />
          </div>
        </div>

        {/* Divider */}
        <div className="border-t my-3" />

        {/* Details */}
        <div className="space-y-1.5 text-xs text-muted-foreground">
          {notary.specialization && (
            <div className="flex items-center gap-2">
              <Briefcase className="h-3.5 w-3.5 shrink-0 text-primary/60" />
              <span>{notary.specialization}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 shrink-0 text-primary/60" />
            <span className="font-mono">#{notary.officialNumber}</span>
          </div>
          {notary.user.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 shrink-0 text-primary/60" />
              <span className="truncate">{notary.user.email}</span>
            </div>
          )}
          {notary.user.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 shrink-0 text-primary/60" />
              <span>{notary.user.phone}</span>
            </div>
          )}
        </div>

        {/* CTA */}
        <Button
          size="sm"
          className="mt-4 w-full text-xs"
          variant="outline"
          onClick={() =>
            window.open(`mailto:${notary.user.email}`, "_blank")
          }
        >
          <Mail className="mr-1.5 h-3.5 w-3.5" />
          Contact Notary
        </Button>
      </div>
    </div>
  );
}

// ── Empty State ──────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div className="rounded-full bg-primary/10 p-5">
        <Scale className="h-10 w-10 text-primary" />
      </div>
      <div>
        <p className="font-semibold text-lg">No notaries found</p>
        <p className="text-sm text-muted-foreground mt-1">
          Try adjusting your filters or search term.
        </p>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function Notaries() {
  const [notaries, setNotaries] = useState<NotaryProfile[]>([]);
  const [filtered, setFiltered] = useState<NotaryProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [wilaya, setWilaya] = useState("all");
  const [specialization, setSpecialization] = useState("all");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  // Fetch
  useEffect(() => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (wilaya && wilaya !== "all") params.set("wilaya", wilaya);
    if (specialization && specialization !== "all")
      params.set("specialization", specialization);

    fetch(`/api/legal/notaries?${params.toString()}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load notaries");
        return r.json();
      })
      .then((data: NotaryProfile[]) => {
        setNotaries(Array.isArray(data) ? data : []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [wilaya, specialization]);

  // Local filter (search + verified)
  useEffect(() => {
    let result = notaries;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (n) =>
          `${n.user.firstName} ${n.user.lastName}`.toLowerCase().includes(q) ||
          n.wilaya.toLowerCase().includes(q) ||
          (n.specialization ?? "").toLowerCase().includes(q)
      );
    }
    if (verifiedOnly) result = result.filter((n) => n.isVerified);
    setFiltered(result);
  }, [notaries, search, verifiedOnly]);

  const clearFilters = () => {
    setSearch("");
    setWilaya("all");
    setSpecialization("all");
    setVerifiedOnly(false);
  };

  const hasActiveFilters =
    search || wilaya !== "all" || specialization !== "all" || verifiedOnly;

  return (
    <Layout>
    <div className="min-h-screen bg-background">
      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/90 via-primary to-secondary/90 text-white">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 py-12">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
              <Scale className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              Notaries Directory
            </h1>
          </div>
          <p className="text-white/80 max-w-xl leading-relaxed">
            Find and connect with certified notaries across Algeria for legal
            document verification, property transfers, and transaction
            certification.
          </p>

          {/* Stats */}
          <div className="flex flex-wrap gap-6 mt-8">
            {[
              { label: "Registered Notaries", value: notaries.length },
              {
                label: "Verified",
                value: notaries.filter((n) => n.isVerified).length,
              },
              { label: "Wilayas Covered", value: new Set(notaries.map((n) => n.wilaya)).size },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl bg-white/10 backdrop-blur-sm px-5 py-3 border border-white/20"
              >
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-white/70 text-xs mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Filters Bar ─────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search by name, wilaya, specialization…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>

            {/* Wilaya */}
            <Select value={wilaya} onValueChange={setWilaya}>
              <SelectTrigger className="w-40 h-9 text-sm">
                <MapPin className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue placeholder="Wilaya" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Wilayas</SelectItem>
                {WILAYAS.map((w) => (
                  <SelectItem key={w} value={w}>
                    {w}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Specialization */}
            <Select
              value={specialization}
              onValueChange={setSpecialization}
            >
              <SelectTrigger className="w-44 h-9 text-sm">
                <Briefcase className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue placeholder="Specialization" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Specializations</SelectItem>
                {SPECIALIZATIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Verified toggle */}
            <button
              onClick={() => setVerifiedOnly((v) => !v)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg border px-3 h-9 text-sm font-medium transition-colors",
                verifiedOnly
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-foreground hover:bg-muted"
              )}
            >
              <BadgeCheck className="h-3.5 w-3.5" />
              Verified only
            </button>

            {/* Clear */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" />
                Clear
              </button>
            )}

            <span className="ml-auto text-xs text-muted-foreground">
              {filtered.length} result{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading notaries…</p>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
            <p className="text-destructive font-medium">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => window.location.reload()}
            >
              Try again
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.length === 0 ? (
              <EmptyState />
            ) : (
              filtered.map((notary) => (
                <NotaryCard key={notary.id} notary={notary} />
              ))
            )}
          </div>
        )}

        {/* Subscription CTA */}
        <div className="mt-12 rounded-2xl border bg-gradient-to-br from-primary/5 to-secondary/5 p-8 text-center">
          <div className="inline-flex rounded-full bg-primary/10 p-3 mb-4">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Are you a Notary?</h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto mb-4">
            Join our verified legal partners directory for 1,000 DA/month. Gain
            visibility to buyers, sellers, and investors across Algeria.
          </p>
          <Button asChild>
            <Link to="/auth/register">Register as a Notary Partner</Link>
          </Button>
        </div>
      </div>
    </div>
    </Layout>
  );
}
