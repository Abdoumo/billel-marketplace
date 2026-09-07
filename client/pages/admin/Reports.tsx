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
  FileWarning,
  Search,
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface Report {
  id: string;
  reason: string;
  description: string | null;
  status: string;
  createdAt: string;
  resolvedAt: string | null;
  reporter: { id: string; firstName: string | null; lastName: string | null };
  listing: { id: string; title: string; status: string } | null;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300" },
  RESOLVED: { label: "Resolved", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
  REJECTED: { label: "Dismissed", className: "bg-muted text-muted-foreground" },
};

export default function AdminReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const token = getAccessToken();
      const res = await fetch("/api/admin/reports", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load reports");
      setReports(await res.json());
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: "RESOLVED" | "REJECTED") => {
    setUpdatingId(id);
    try {
      const token = getAccessToken();
      const res = await fetch(`/api/admin/reports/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update");
      const updated = await res.json();
      setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status: updated.status } : r)));
      toast.success(`Report marked as ${status.toLowerCase()}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const filtered = reports.filter((r) => {
    const q = search.toLowerCase();
    return (
      (r.reason ?? "").toLowerCase().includes(q) ||
      (r.listing?.title ?? "").toLowerCase().includes(q) ||
      (r.reporter?.firstName ?? "").toLowerCase().includes(q) ||
      r.status.toLowerCase().includes(q)
    );
  });

  const pending = reports.filter((r) => r.status === "PENDING").length;
  const resolved = reports.filter((r) => r.status === "RESOLVED").length;

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black">Reports Management</h1>
          <p className="text-muted-foreground mt-1">
            Handle user reports about listings and platform conduct
          </p>
        </div>
        <Button variant="outline" onClick={fetchReports} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total Reports", value: reports.length, color: "" },
          { label: "Pending", value: pending, color: "text-yellow-600" },
          { label: "Resolved", value: resolved, color: "text-emerald-600" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">
              {s.label}
            </p>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="flex items-center gap-4 p-5 border-b border-border">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="reports-search"
              placeholder="Search by reason, listing, or reporter..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileWarning className="h-4 w-4" />
            <span>{filtered.length} reports</span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <FileWarning className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">No reports found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Listing</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Reporter</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((report) => {
                  const sc = statusConfig[report.status] ?? { label: report.status, className: "bg-muted text-muted-foreground" };
                  const isPending = report.status === "PENDING";
                  return (
                    <TableRow key={report.id} className="hover:bg-muted/20">
                      <TableCell>
                        {report.listing ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium line-clamp-1 max-w-[180px]">
                              {report.listing.title}
                            </span>
                            <Link to={`/listing/${report.listing.id}`}>
                              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground hover:text-primary shrink-0" />
                            </Link>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium capitalize">{report.reason.replace(/_/g, " ")}</div>
                        {report.description && (
                          <div className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">
                            {report.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {report.reporter?.firstName} {report.reporter?.lastName ?? ""}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${sc.className}`}>
                          {sc.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {isPending && (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={updatingId === report.id}
                              onClick={() => updateStatus(report.id, "RESOLVED")}
                              className="gap-1.5 text-xs border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                            >
                              {updatingId === report.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              )}
                              Resolve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={updatingId === report.id}
                              onClick={() => updateStatus(report.id, "REJECTED")}
                              className="gap-1.5 text-xs border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <XCircle className="h-3.5 w-3.5" /> Dismiss
                            </Button>
                          </div>
                        )}
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
