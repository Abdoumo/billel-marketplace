import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Heart, Eye, MapPin, TrendingUp, Rocket, BarChart2, Globe, Cpu, LayoutDashboard, FileText, Layers } from "lucide-react";
import { useState } from "react";

export interface Listing {
  id: string;
  title: string;
  description: string;
  asking_price: number;
  category: "startup" | "shares" | "domain" | "patent" | "app" | "saas" | "design";
  state: "finished" | "in_execution" | "testing" | "in_development" | "idea";
  location: string;
  evaluation_color: "light_blue" | "purple" | "green";
  evaluation_type: "self" | "local_expert" | "certified";
  view_count: number;
  seller_name: string;
  is_verified: boolean;
  is_featured: boolean;
  image_url: string;
  revenue?: number;
}

const categoryLabels: Record<Listing["category"], string> = {
  startup: "Startup",
  shares: "Equity",
  domain: "Domain",
  patent: "Patent",
  app: "App",
  saas: "SaaS",
  design: "Design",
};

const stateLabels: Record<Listing["state"], string> = {
  finished: "Finished",
  in_execution: "In Execution",
  testing: "Testing",
  in_development: "In Dev",
  idea: "Idea",
};

const evaluationBadgeConfig = {
  light_blue: {
    bg: "bg-blue-100 dark:bg-blue-900/40",
    text: "text-blue-700 dark:text-blue-300",
    label: "AUTO-ESTIMATED",
  },
  purple: {
    bg: "bg-purple-100 dark:bg-purple-900/40",
    text: "text-purple-700 dark:text-purple-300",
    label: "LOCAL EXPERT",
  },
  green: {
    bg: "bg-emerald-100 dark:bg-emerald-900/40",
    text: "text-emerald-700 dark:text-emerald-300",
    label: "CERTIFIED",
  },
};

// Per-category placeholder visuals
const categoryPlaceholder: Record<
  Listing["category"],
  { gradient: string; Icon: React.FC<{ className?: string }> }
> = {
  startup: { gradient: "from-blue-600 via-blue-500 to-cyan-400", Icon: Rocket },
  shares: { gradient: "from-purple-600 via-purple-500 to-pink-400", Icon: BarChart2 },
  domain: { gradient: "from-teal-600 via-teal-500 to-emerald-400", Icon: Globe },
  patent: { gradient: "from-amber-600 via-amber-500 to-yellow-400", Icon: FileText },
  app: { gradient: "from-rose-600 via-rose-500 to-orange-400", Icon: Cpu },
  saas: { gradient: "from-indigo-600 via-indigo-500 to-violet-400", Icon: LayoutDashboard },
  design: { gradient: "from-fuchsia-600 via-fuchsia-500 to-pink-400", Icon: Layers },
};

function ImageWithFallback({
  src,
  alt,
  category,
}: {
  src: string;
  alt: string;
  category: Listing["category"];
}) {
  const [failed, setFailed] = useState(!src || src.trim() === "");
  const placeholder = categoryPlaceholder[category];
  const Icon = placeholder.Icon;

  if (failed) {
    return (
      <div
        className={`w-full h-full bg-gradient-to-br ${placeholder.gradient} flex flex-col items-center justify-center gap-3`}
      >
        <Icon className="h-16 w-16 text-white/80 drop-shadow-lg" />
        <span className="text-white/70 text-xs font-semibold uppercase tracking-widest">
          {categoryLabels[category]}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
    />
  );
}

export const ListingCard = ({ listing }: { listing: Listing }) => {
  const [isFavorited, setIsFavorited] = useState(false);
  const badgeConfig = evaluationBadgeConfig[listing.evaluation_color];

  return (
    <Link to={`/listing/${listing.id}`} className="block h-full">
      <div className="group h-full rounded-2xl border border-border overflow-hidden hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 bg-card flex flex-col">
        {/* ── Image Container ── */}
        <div className="relative overflow-hidden h-48 shrink-0">
          <ImageWithFallback
            src={listing.image_url}
            alt={listing.title}
            category={listing.category}
          />

          {/* Dark overlay for readability of badges */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

          {/* Featured Badge */}
          {listing.is_featured && (
            <div className="absolute top-3 left-3 bg-accent text-accent-foreground px-3 py-1 rounded-full text-xs font-bold shadow-md">
              ⭐ Featured
            </div>
          )}

          {/* Evaluation Badge */}
          <div
            className={`absolute top-3 right-3 ${badgeConfig.bg} ${badgeConfig.text} px-3 py-1 rounded-full text-[10px] font-bold shadow-sm`}
          >
            {badgeConfig.label}
          </div>

          {/* Favorite Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              setIsFavorited(!isFavorited);
            }}
            className="absolute bottom-3 right-3 h-9 w-9 rounded-full bg-white/90 backdrop-blur hover:bg-white transition-all flex items-center justify-center shadow-md hover:scale-110 active:scale-95"
          >
            <Heart
              className={`h-4 w-4 transition-colors ${
                isFavorited ? "fill-rose-500 text-rose-500" : "text-slate-600"
              }`}
            />
          </button>
        </div>

        {/* ── Content ── */}
        <div className="p-5 space-y-3 flex flex-col flex-1">
          {/* Category & State */}
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline" className="text-[10px] font-semibold">
              {categoryLabels[listing.category]}
            </Badge>
            <Badge variant="secondary" className="text-[10px] font-semibold">
              {stateLabels[listing.state]}
            </Badge>
          </div>

          {/* Title */}
          <h3 className="font-bold text-base line-clamp-2 group-hover:text-primary transition-colors leading-snug">
            {listing.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {listing.description}
          </p>

          {/* Location */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span>{listing.location}</span>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Seller Info */}
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-[10px] font-bold shrink-0">
              {listing.seller_name?.charAt(0)?.toUpperCase() ?? "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-xs truncate">{listing.seller_name}</p>
              {listing.is_verified && (
                <span className="text-[10px] text-primary font-semibold">✓ Verified Seller</span>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-border" />

          {/* Price & Stats */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                Asking Price
              </p>
              <p className="text-xl font-black text-primary leading-tight">
                {listing.asking_price.toLocaleString()}
                <span className="text-xs font-semibold text-muted-foreground ml-1">DA</span>
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-lg px-2 py-1.5">
              <Eye className="h-3.5 w-3.5" />
              <span className="font-medium">{listing.view_count.toLocaleString()}</span>
            </div>
          </div>

          {/* Revenue if available */}
          {listing.revenue && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 text-xs">
              <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="text-emerald-700 dark:text-emerald-300 font-semibold">
                {listing.revenue.toLocaleString()} DA / month revenue
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};
