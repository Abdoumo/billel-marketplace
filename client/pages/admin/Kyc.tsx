import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Check,
  X,
  FileText,
  Loader2,
  Eye,
  Search,
  RefreshCw,
  Download,
  ImageIcon,
  ClipboardCheck,
  ChevronLeft,
  ChevronRight,
  User,
  IdCard,
  Camera,
  FileCheck,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { getAccessToken } from "@/lib/auth";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────
interface KycDoc {
  url: string;
  name: string;
  type: string; // e.g. "id_front" | "id_back" | "selfie"
}

interface KycSubmission {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  kycStatus: string;
  kycDocuments: (KycDoc | string)[];   // support both formats
  kycSubmittedAt: string;
}

// Normalise to KycDoc regardless of how it was stored
function normalizeDoc(raw: KycDoc | string, idx: number): KycDoc {
  if (typeof raw === "string") return { url: raw, name: `Document ${idx + 1}`, type: "document" };
  return raw;
}

// Map doc.type to a readable label and icon
const docTypeConfig: Record<string, { label: string; Icon: React.FC<{ className?: string }> }> = {
  id_front:  { label: "ID Front",  Icon: IdCard   },
  id_back:   { label: "ID Back",   Icon: IdCard   },
  selfie:    { label: "Selfie",    Icon: Camera   },
  passport:  { label: "Passport",  Icon: FileCheck },
  document:  { label: "Document",  Icon: FileText  },
};

// ── Document Preview Modal ─────────────────────────────────────────────
function DocModal({
  docs,
  startIndex,
  userName,
  onClose,
}: {
  docs: KycDoc[];
  startIndex: number;
  userName: string;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(startIndex);
  const doc = docs[current];
  const { url, name, type } = doc;

  const isBase64 = url.startsWith("data:");
  const isImage =
    isBase64
      ? url.startsWith("data:image/")
      : /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i.test(url);
  const isPdf =
    isBase64
      ? url.startsWith("data:application/pdf")
      : /\.pdf(\?.*)?$/i.test(url);

  const typeInfo = docTypeConfig[type] ?? docTypeConfig["document"];
  const TypeIcon = typeInfo.Icon;

  // Download helper for base64
  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = url;
    a.download = name || `doc-${current + 1}`;
    a.click();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <TypeIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-bold text-sm">{typeInfo.label}</p>
              <p className="text-xs text-muted-foreground">{name} · {userName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5 transition-colors"
              title="Download"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </button>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Viewer */}
        <div className="flex-1 overflow-auto bg-muted/30 flex items-center justify-center p-4 min-h-[300px]">
          {isImage ? (
            <img
              src={url}
              alt={name}
              className="max-w-full max-h-[60vh] object-contain rounded-xl shadow-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : isPdf ? (
            <iframe
              src={url}
              title={name}
              className="w-full h-[60vh] rounded-xl border border-border"
            />
          ) : (
            <div className="text-center py-12 space-y-3">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <p className="font-semibold">Cannot preview this file</p>
              <p className="text-sm text-muted-foreground">{name}</p>
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-2 mt-2 text-sm text-primary hover:underline"
              >
                <Download className="h-4 w-4" /> Download to view
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        {docs.length > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border shrink-0 bg-card">
            <Button
              variant="outline"
              size="sm"
              disabled={current === 0}
              onClick={() => setCurrent((c) => c - 1)}
              className="gap-1.5"
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </Button>

            <div className="flex items-center gap-3">
              {docs.map((d, i) => {
                const cfg = docTypeConfig[d.type] ?? docTypeConfig["document"];
                const Icon = cfg.Icon;
                return (
                  <button
                    key={i}
                    onClick={() => setCurrent(i)}
                    className={`flex flex-col items-center gap-1 px-2 py-1 rounded-lg transition-all ${
                      i === current
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-[9px] font-semibold uppercase tracking-wide">
                      {cfg.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              disabled={current === docs.length - 1}
              onClick={() => setCurrent((c) => c + 1)}
              className="gap-1.5"
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Thumbnail strip ────────────────────────────────────────────────────
function DocThumbnail({
  doc,
  index,
  onClick,
}: {
  doc: KycDoc;
  index: number;
  onClick: () => void;
}) {
  const { url, name, type } = doc;
  const isImage = url.startsWith("data:image/") || /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(url);
  const typeInfo = docTypeConfig[type] ?? docTypeConfig["document"];
  const Icon = typeInfo.Icon;

  return (
    <button
      onClick={onClick}
      className="group relative w-16 h-16 rounded-xl border border-border overflow-hidden hover:border-primary/50 hover:shadow-md transition-all bg-muted/30 flex-shrink-0"
      title={`${typeInfo.label}: ${name}`}
    >
      {isImage ? (
        <>
          <img
            src={url}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
            <Eye className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-1">
          <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
          <span className="text-[8px] text-muted-foreground font-semibold uppercase tracking-wide">
            {typeInfo.label}
          </span>
        </div>
      )}
      {/* Index badge */}
      <div className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
        {index + 1}
      </div>
    </button>
  );
}

// ── Main KYC Page ──────────────────────────────────────────────────────
export default function AdminKyc() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<KycSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<{ docs: KycDoc[]; index: number; name: string } | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchKycQueue = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = getAccessToken();
      const res = await fetch("/api/admin/kyc", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch KYC queue");
      const data = await res.json();
      setSubmissions(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchKycQueue(); }, []);

  const handleUpdateStatus = async (id: string, status: "VERIFIED" | "REJECTED") => {
    setUpdatingId(id + status);
    try {
      const token = getAccessToken();
      const res = await fetch(`/api/admin/kyc/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ kycStatus: status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      setSubmissions((prev) => prev.filter((sub) => sub.id !== id));
      toast.success(`KYC ${status === "VERIFIED" ? "✅ Approved" : "❌ Rejected"}`);
    } catch (err: any) {
      toast.error("Error: " + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = submissions.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.email.toLowerCase().includes(q) ||
      (s.firstName ?? "").toLowerCase().includes(q) ||
      (s.lastName ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <AdminLayout>
      {/* Modal */}
      {modal && (
        <DocModal
          docs={modal.docs}
          startIndex={modal.index}
          userName={modal.name}
          onClose={() => setModal(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black">KYC Validation Queue</h1>
          <p className="text-muted-foreground mt-1">
            Review identity documents — click any thumbnail to preview in full
          </p>
        </div>
        <Button variant="outline" onClick={fetchKycQueue} disabled={isLoading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Pending Review</p>
          <p className="text-2xl font-black text-yellow-600">{submissions.length}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Filtered</p>
          <p className="text-2xl font-black">{filtered.length}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-4 p-5 border-b border-border">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="kyc-search"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ClipboardCheck className="h-4 w-4" />
            <span>{filtered.length} pending</span>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-destructive font-medium">{error}</p>
            <Button variant="outline" className="mt-4" onClick={fetchKycQueue}>Try Again</Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <ClipboardCheck className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">No pending KYC submissions</p>
            <p className="text-sm mt-1">All submissions have been reviewed</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((sub) => {
              const name = [sub.firstName, sub.lastName].filter(Boolean).join(" ") || sub.email;
              const rawDocs = Array.isArray(sub.kycDocuments) ? sub.kycDocuments : [];
              const docs: KycDoc[] = rawDocs.map((d, i) => normalizeDoc(d, i));

              return (
                <div key={sub.id} className="p-5 hover:bg-muted/10 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-5">
                    {/* User info */}
                    <div className="flex items-center gap-3 sm:w-56 shrink-0">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {(sub.firstName?.[0] ?? sub.email[0]).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate">{name}</p>
                        <p className="text-xs text-muted-foreground truncate">{sub.email}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {sub.kycSubmittedAt
                            ? new Date(sub.kycSubmittedAt).toLocaleDateString("en-GB", {
                                day: "2-digit", month: "short", year: "numeric",
                              })
                            : "—"}
                        </p>
                      </div>
                    </div>

                    {/* Document thumbnails */}
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground font-medium mb-2 uppercase tracking-wide">
                        {docs.length} document{docs.length !== 1 ? "s" : ""} — click to preview
                      </p>
                      {docs.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">No documents uploaded</p>
                      ) : (
                        <div className="flex gap-2 flex-wrap">
                          {docs.map((doc, idx) => (
                            <DocThumbnail
                              key={idx}
                              doc={doc}
                              index={idx}
                              onClick={() => setModal({ docs, index: idx, name })}
                            />
                          ))}
                          {/* Label strip */}
                          <div className="flex gap-2 flex-wrap w-full mt-1">
                            {docs.map((doc, idx) => {
                              const cfg = docTypeConfig[doc.type] ?? docTypeConfig["document"];
                              return (
                                <span key={idx} className="text-[10px] text-muted-foreground w-16 text-center truncate">
                                  {cfg.label}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex sm:flex-col gap-2 shrink-0">
                      <Button
                        size="sm"
                        disabled={updatingId === sub.id + "VERIFIED"}
                        onClick={() => handleUpdateStatus(sub.id, "VERIFIED")}
                        className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20"
                      >
                        {updatingId === sub.id + "VERIFIED" ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={updatingId === sub.id + "REJECTED"}
                        onClick={() => handleUpdateStatus(sub.id, "REJECTED")}
                        className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        {updatingId === sub.id + "REJECTED" ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <X className="h-3.5 w-3.5" />
                        )}
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
