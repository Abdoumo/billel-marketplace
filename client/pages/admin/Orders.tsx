import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { getAccessToken } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ShoppingBag,
  Search,
  Loader2,
  ArrowUpRight,
  RefreshCw,
  X,
  CheckCircle2,
  XCircle,
  Clock,
  Lock,
  Banknote,
  AlertTriangle,
  ChevronRight,
  User,
  Store,
  Tag,
  CalendarDays,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface Order {
  id: string;
  amount: number;
  escrowStatus: string;
  paymentRef: string | null;
  createdAt: string;
  completedAt: string | null;
  listingId: string;
  buyer: { id: string; firstName: string | null; lastName: string | null; email: string };
  seller: { id: string; firstName: string | null; lastName: string | null; email: string };
  listing: {
    id: string;
    title: string;
    category: string;
    askingPrice?: number;
    mediaUrls?: string[] | null;
    description?: string;
  };
}

// ── Status config ─────────────────────────────────────────────────────
const statusConfig: Record<
  string,
  { label: string; badge: string; icon: React.FC<{ className?: string }> }
> = {
  PENDING: {
    label: "Pending",
    badge: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
    icon: Clock,
  },
  PAYMENT_CONFIRMED: {
    label: "Payment Confirmed",
    badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
    icon: CheckCircle2,
  },
  ESCROW_HELD: {
    label: "In Escrow",
    badge: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
    icon: Lock,
  },
  COMPLETED: {
    label: "Completed",
    badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: "Cancelled",
    badge: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
    icon: XCircle,
  },
  DISPUTED: {
    label: "Disputed",
    badge: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
    icon: AlertTriangle,
  },
};

// ── Next-action transitions for admin ─────────────────────────────────
const adminActions: Record<
  string,
  { label: string; next: string; variant: "approve" | "danger" | "neutral" }[]
> = {
  PENDING: [
    { label: "Confirm Payment", next: "PAYMENT_CONFIRMED", variant: "approve" },
    { label: "Cancel Order", next: "CANCELLED", variant: "danger" },
  ],
  PAYMENT_CONFIRMED: [
    { label: "Move to Escrow", next: "ESCROW_HELD", variant: "approve" },
    { label: "Cancel Order", next: "CANCELLED", variant: "danger" },
  ],
  ESCROW_HELD: [
    { label: "Complete & Release Funds", next: "COMPLETED", variant: "approve" },
    { label: "Mark as Disputed", next: "DISPUTED", variant: "danger" },
  ],
  DISPUTED: [
    { label: "Resolve → Complete", next: "COMPLETED", variant: "approve" },
    { label: "Cancel Order", next: "CANCELLED", variant: "danger" },
  ],
  COMPLETED: [],
  CANCELLED: [],
};

// ── Detail panel ──────────────────────────────────────────────────────
function OrderDetailPanel({
  order,
  onClose,
  onUpdate,
}: {
  order: Order;
  onClose: () => void;
  onUpdate: (updated: Order) => void;
}) {
  const [updating, setUpdating] = useState<string | null>(null);
  const sc = statusConfig[order.escrowStatus] ?? statusConfig["PENDING"];
  const StatusIcon = sc.icon;
  const actions = adminActions[order.escrowStatus] ?? [];
  const mediaUrls: string[] = Array.isArray(order.listing.mediaUrls)
    ? (order.listing.mediaUrls as string[])
    : [];
  const firstImage = mediaUrls.find((u) => /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(u));

  const handleAction = async (next: string) => {
    setUpdating(next);
    try {
      const token = getAccessToken();
      const res = await fetch(`/api/admin/orders/${order.id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ escrowStatus: next }),
      });
      if (!res.ok) throw new Error("Failed to update order");
      const updated = await res.json();
      onUpdate(updated);
      toast.success(`Order moved to: ${statusConfig[next]?.label ?? next}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUpdating(null);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Slide-in panel */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg bg-card border-l border-border shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Panel header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="font-bold text-base">Order Details</h2>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              #{order.id.slice(0, 12)}…
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status badge */}
          <div className="flex items-center justify-between">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${sc.badge}`}
            >
              <StatusIcon className="h-3.5 w-3.5" />
              {sc.label}
            </span>
            <span className="text-xs text-muted-foreground">
              {new Date(order.createdAt).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>

          {/* Listing preview */}
          <div className="rounded-2xl border border-border overflow-hidden">
            {firstImage ? (
              <img
                src={firstImage}
                alt={order.listing.title}
                className="w-full h-40 object-cover"
              />
            ) : (
              <div className="w-full h-40 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <Tag className="h-10 w-10 text-primary/40" />
              </div>
            )}
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-sm leading-snug">{order.listing.title}</p>
                  <p className="text-xs text-muted-foreground capitalize mt-0.5">
                    {order.listing.category.replace(/_/g, " ")}
                  </p>
                </div>
                <Link to={`/listing/${order.listing.id}`} target="_blank">
                  <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs shrink-0">
                    View <ExternalLink className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
              {order.listing.description && (
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                  {order.listing.description}
                </p>
              )}
            </div>
          </div>

          {/* Amount */}
          <div className="rounded-2xl bg-primary/5 border border-primary/20 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Banknote className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold text-muted-foreground">Transaction Amount</span>
            </div>
            <span className="text-2xl font-black text-primary">
              {order.amount.toLocaleString()}
              <span className="text-sm font-semibold ml-1 text-muted-foreground">DA</span>
            </span>
          </div>

          {/* Parties */}
          <div className="grid grid-cols-2 gap-3">
            {/* Buyer */}
            <div className="rounded-xl border border-border p-4 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <User className="h-3.5 w-3.5" /> Buyer
              </div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {(order.buyer.firstName?.[0] ?? order.buyer.email[0]).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {order.buyer.firstName} {order.buyer.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{order.buyer.email}</p>
                </div>
              </div>
            </div>

            {/* Seller */}
            <div className="rounded-xl border border-border p-4 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <Store className="h-3.5 w-3.5" /> Seller
              </div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {(order.seller.firstName?.[0] ?? order.seller.email[0]).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {order.seller.firstName} {order.seller.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{order.seller.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment ref */}
          {order.paymentRef && (
            <div className="rounded-xl border border-border p-3 flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">Payment Ref:</span>
              <span className="text-xs font-mono text-foreground">{order.paymentRef}</span>
            </div>
          )}

          {/* Completed at */}
          {order.completedAt && (
            <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium">
              <CalendarDays className="h-3.5 w-3.5" />
              Completed on {new Date(order.completedAt).toLocaleDateString()}
            </div>
          )}
        </div>

        {/* Actions footer */}
        {actions.length > 0 && (
          <div className="px-6 py-4 border-t border-border space-y-2 shrink-0">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-3">
              Admin Actions
            </p>
            {actions.map((action) => (
              <Button
                key={action.next}
                className={`w-full gap-2 font-semibold ${
                  action.variant === "approve"
                    ? "bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 shadow-md shadow-primary/20"
                    : "border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                }`}
                variant={action.variant === "approve" ? "default" : "outline"}
                disabled={!!updating}
                onClick={() => handleAction(action.next)}
              >
                {updating === action.next ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : action.variant === "approve" ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ── Main Orders Page ──────────────────────────────────────────────────
export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = getAccessToken();
      const res = await fetch("/api/admin/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load orders");
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdate = (updated: Order) => {
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    setSelected(updated);
  };

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase();
    const matchesSearch =
      o.id.toLowerCase().includes(q) ||
      o.listing.title.toLowerCase().includes(q) ||
      o.buyer.email.toLowerCase().includes(q) ||
      (o.buyer.firstName ?? "").toLowerCase().includes(q) ||
      o.seller.email.toLowerCase().includes(q) ||
      (o.seller.firstName ?? "").toLowerCase().includes(q) ||
      o.escrowStatus.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "ALL" || o.escrowStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const totalRevenue = orders
    .filter((o) => o.escrowStatus === "COMPLETED")
    .reduce((sum, o) => sum + o.amount, 0);

  const statCounts = {
    total: orders.length,
    pending: orders.filter((o) => o.escrowStatus === "PENDING").length,
    inEscrow: orders.filter((o) => o.escrowStatus === "ESCROW_HELD").length,
    completed: orders.filter((o) => o.escrowStatus === "COMPLETED").length,
  };

  const statusFilters = ["ALL", "PENDING", "PAYMENT_CONFIRMED", "ESCROW_HELD", "COMPLETED", "CANCELLED", "DISPUTED"];

  return (
    <AdminLayout>
      {/* Detail panel */}
      {selected && (
        <OrderDetailPanel
          order={selected}
          onClose={() => setSelected(null)}
          onUpdate={handleUpdate}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black">Orders & Transactions</h1>
          <p className="text-muted-foreground mt-1">
            Manage escrow lifecycle — approve, hold funds, and complete deals
          </p>
        </div>
        <Button variant="outline" onClick={fetchOrders} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Orders", value: statCounts.total, color: "text-foreground" },
          { label: "Pending", value: statCounts.pending, color: "text-yellow-600" },
          { label: "In Escrow", value: statCounts.inEscrow, color: "text-purple-600" },
          {
            label: "Revenue (Completed)",
            value: `${totalRevenue.toLocaleString()} DA`,
            color: "text-emerald-600",
          },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">
              {s.label}
            </p>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-5 border-b border-border">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="orders-search"
              placeholder="Search listing, buyer, seller..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {/* Status filter pills */}
          <div className="flex gap-1.5 flex-wrap">
            {statusFilters.map((s) => {
              const sc = s === "ALL" ? null : statusConfig[s];
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    statusFilter === s
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {s === "ALL" ? "All" : sc?.label ?? s}
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">No orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Listing</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Seller</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((order) => {
                  const sc = statusConfig[order.escrowStatus] ?? statusConfig["PENDING"];
                  const StatusIcon = sc.icon;
                  const isSelected = selected?.id === order.id;
                  const hasActions = (adminActions[order.escrowStatus] ?? []).length > 0;

                  return (
                    <TableRow
                      key={order.id}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-primary/5 border-l-2 border-l-primary"
                          : "hover:bg-muted/20"
                      }`}
                      onClick={() => setSelected(order)}
                    >
                      <TableCell>
                        <div className="font-semibold text-sm line-clamp-1 max-w-[200px]">
                          {order.listing.title}
                        </div>
                        <div className="text-xs text-muted-foreground capitalize mt-0.5">
                          {order.listing.category.replace(/_/g, " ")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                            {(order.buyer.firstName?.[0] ?? order.buyer.email[0]).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium truncate">
                              {order.buyer.firstName} {order.buyer.lastName}
                            </p>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {order.buyer.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                            {(order.seller.firstName?.[0] ?? order.seller.email[0]).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium truncate">
                              {order.seller.firstName} {order.seller.lastName}
                            </p>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {order.seller.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-black text-primary text-sm">
                          {order.amount.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-muted-foreground ml-1">DA</span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${sc.badge}`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {sc.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {hasActions && (
                            <span className="text-[10px] text-primary font-semibold bg-primary/10 px-2 py-0.5 rounded-full">
                              Action needed
                            </span>
                          )}
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
