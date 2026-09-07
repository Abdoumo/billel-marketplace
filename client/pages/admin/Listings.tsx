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
  LayoutList,
  Search,
  Loader2,
  Check,
  X,
  RefreshCw,
  ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface PendingListing {
  id: string;
  title: string;
  category: string;
  asking_price: number;
  status: string;
  createdAt: string;
  seller: { id: string; firstName: string | null; lastName: string | null; email: string };
}

export default function AdminListings() {
  const [listings, setListings] = useState<PendingListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const token = getAccessToken();
      const res = await fetch("/api/admin/listings/pending", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load listings");
      setListings(await res.json());
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: "ACTIVE" | "REJECTED") => {
    setUpdatingId(id);
    try {
      const token = getAccessToken();
      const res = await fetch(`/api/admin/listings/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setListings((prev) => prev.filter((l) => l.id !== id));
      toast.success(`Listing ${status === "ACTIVE" ? "approved" : "rejected"}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const filtered = listings.filter((l) => {
    const q = search.toLowerCase();
    return (
      l.title.toLowerCase().includes(q) ||
      l.category.toLowerCase().includes(q) ||
      l.seller.email.toLowerCase().includes(q)
    );
  });

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black">Listings Moderation</h1>
          <p className="text-muted-foreground mt-1">
            Review and approve or reject listings pending moderation
          </p>
        </div>
        <Button variant="outline" onClick={fetchListings} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">
            Pending Review
          </p>
          <p className="text-2xl font-black text-yellow-600">{listings.length}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">
            Filtered
          </p>
          <p className="text-2xl font-black">{filtered.length}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="flex items-center gap-4 p-5 border-b border-border">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="listings-search"
              placeholder="Search by title, category, seller..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <LayoutList className="h-4 w-4" />
            <span>{filtered.length} pending</span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <LayoutList className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">No pending listings</p>
            <p className="text-sm mt-1">All listings have been reviewed</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Listing</TableHead>
                  <TableHead>Seller</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((listing) => (
                  <TableRow key={listing.id} className="hover:bg-muted/20">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-sm line-clamp-1 max-w-[220px]">
                          {listing.title}
                        </div>
                        <Link to={`/listing/${listing.id}`}>
                          <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                        </Link>
                      </div>
                      <div className="text-xs text-muted-foreground capitalize mt-0.5">
                        {listing.category.replace("_", " ")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">
                        {listing.seller.firstName} {listing.seller.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground">{listing.seller.email}</div>
                    </TableCell>
                    <TableCell>
                      <span className="font-bold text-primary">
                        {listing.asking_price?.toLocaleString()}
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">DA</span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(listing.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={updatingId === listing.id}
                          onClick={() => updateStatus(listing.id, "ACTIVE")}
                          className="gap-1.5 text-xs border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                        >
                          {updatingId === listing.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )}
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={updatingId === listing.id}
                          onClick={() => updateStatus(listing.id, "REJECTED")}
                          className="gap-1.5 text-xs border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <X className="h-3.5 w-3.5" /> Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
