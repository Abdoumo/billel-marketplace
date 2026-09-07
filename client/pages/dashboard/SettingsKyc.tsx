import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  UploadCloud,
  X,
  FileText,
  ShieldCheck,
  ShieldX,
  Eye,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getAccessToken } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface UploadedFile {
  file: File;
  preview?: string;
  type: "id_front" | "id_back" | "selfie";
}

const DOC_SLOTS: {
  key: UploadedFile["type"];
  label: string;
  description: string;
}[] = [
  {
    key: "id_front",
    label: "ID Front",
    description: "National ID / Passport — Front side",
  },
  {
    key: "id_back",
    label: "ID Back",
    description: "National ID / Passport — Back side",
  },
  { key: "selfie", label: "Selfie", description: "Selfie holding your ID" },
];

export default function SettingsKyc() {
  const { user, fetchMe } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [kycStatus, setKycStatus] = useState<string>("UNVERIFIED");
  const [isDragging, setIsDragging] = useState<
    UploadedFile["type"] | null
  >(null);
  const [files, setFiles] = useState<Partial<Record<UploadedFile["type"], File>>>({});
  const fileInputRefs = useRef<Partial<Record<UploadedFile["type"], HTMLInputElement>>>({});

  useEffect(() => {
    if (user?.kycStatus) {
      setKycStatus(user.kycStatus);
    }
    // Refresh user data on mount to get latest KYC status
    fetchMe();
  }, [user?.kycStatus, fetchMe]);

  const handleFileSelect = (
    slotKey: UploadedFile["type"],
    selectedFile: File | null
  ) => {
    if (!selectedFile) return;
    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowedTypes.includes(selectedFile.type)) {
      setError("Only JPG, PNG, or PDF files are allowed.");
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("File must be under 5 MB.");
      return;
    }
    setError(null);
    setFiles((prev) => ({ ...prev, [slotKey]: selectedFile }));
  };

  const removeFile = (slotKey: UploadedFile["type"]) => {
    setFiles((prev) => {
      const next = { ...prev };
      delete next[slotKey];
      return next;
    });
  };

  const handleDrop = useCallback(
    (e: React.DragEvent, slotKey: UploadedFile["type"]) => {
      e.preventDefault();
      setIsDragging(null);
      const dropped = e.dataTransfer.files[0];
      if (dropped) handleFileSelect(slotKey, dropped);
    },
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.keys(files).length === 0) {
      setError("Please upload at least one document.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // Convert files to base64 data URLs for submission (mock S3 in dev)
      const documentEntries = await Promise.all(
        Object.entries(files).map(async ([key, file]) => {
          return new Promise<[string, string]>((resolve) => {
            const reader = new FileReader();
            reader.onload = () =>
              resolve([key, reader.result as string]);
            reader.readAsDataURL(file!);
          });
        })
      );

      // Build document URLs — storing full base64 string for dev mock instead of S3 URLs
      const documents = documentEntries.map(([key, dataUrl]) => ({
        type: key,
        url: dataUrl,
        name: (files as any)[key]?.name,
      }));

      const token = getAccessToken();
      const res = await fetch("/api/users/kyc", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ documents }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit KYC");

      setSuccess(
        "Your KYC documents have been submitted successfully. Please wait for admin approval (1–2 business days)."
      );
      setKycStatus("PENDING");
      setFiles({});
      if (fetchMe) fetchMe();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Status Banner ──────────────────────────────────────────────────────────
  const StatusBanner = () => {
    if (kycStatus === "VERIFIED") {
      return (
        <div className="flex items-start gap-4 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" />
          <div>
            <p className="font-semibold text-emerald-800">Identity Verified</p>
            <p className="mt-0.5 text-sm text-emerald-700">
              Your identity has been verified. You have full access to all
              marketplace features, including creating listings and accepting
              transactions.
            </p>
          </div>
          <Badge className="ml-auto shrink-0 bg-emerald-600 text-white">
            Verified
          </Badge>
        </div>
      );
    }
    if (kycStatus === "PENDING") {
      return (
        <div className="flex items-start gap-4 rounded-xl border border-blue-200 bg-blue-50 p-5">
          <Clock className="mt-0.5 h-6 w-6 shrink-0 text-blue-500 animate-pulse" />
          <div>
            <p className="font-semibold text-blue-800">Pending Review</p>
            <p className="mt-0.5 text-sm text-blue-700">
              Your KYC documents are currently under review by our
              administrators. This usually takes 1–2 business days.
            </p>
          </div>
          <Badge className="ml-auto shrink-0 bg-blue-500 text-white">
            In Review
          </Badge>
        </div>
      );
    }
    if (kycStatus === "REJECTED") {
      return (
        <div className="flex items-start gap-4 rounded-xl border border-red-200 bg-red-50 p-5">
          <ShieldX className="mt-0.5 h-6 w-6 shrink-0 text-red-500" />
          <div>
            <p className="font-semibold text-red-800">Verification Rejected</p>
            <p className="mt-0.5 text-sm text-red-700">
              Your previous KYC submission was rejected. Please upload clear,
              valid documents and try again.
            </p>
          </div>
          <Badge className="ml-auto shrink-0 bg-red-500 text-white">
            Rejected
          </Badge>
        </div>
      );
    }
    // UNVERIFIED / not yet submitted
    return (
      <div className="flex items-start gap-4 rounded-xl border border-amber-200 bg-amber-50 p-5">
        <AlertCircle className="mt-0.5 h-6 w-6 shrink-0 text-amber-500" />
        <div>
          <p className="font-semibold text-amber-800">Verification Required</p>
          <p className="mt-0.5 text-sm text-amber-700">
            Complete KYC verification to unlock seller features, start listing
            digital assets, and build buyer trust.
          </p>
        </div>
      </div>
    );
  };

  const canSubmit =
    kycStatus === "UNVERIFIED" || kycStatus === "REJECTED";

  return (
    <Layout>
      <div className="container py-10">
      <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">KYC Verification</h3>
        <p className="text-sm text-muted-foreground mt-0.5">
          Complete Know Your Customer verification to unlock full marketplace
          access and seller features.
        </p>
      </div>

      {/* Status */}
      <StatusBanner />

      {/* Steps indicator */}
      <div className="flex items-center gap-2">
        {[
          { step: 1, label: "Upload Docs", done: Object.keys(files).length > 0 || kycStatus !== "UNVERIFIED" },
          { step: 2, label: "Submit", done: kycStatus === "PENDING" || kycStatus === "VERIFIED" },
          { step: 3, label: "Verified", done: kycStatus === "VERIFIED" },
        ].map((item, idx, arr) => (
          <div key={item.step} className="flex items-center gap-2 flex-1">
            <div
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                item.done
                  ? "bg-primary text-primary-foreground"
                  : "border-2 border-border text-muted-foreground"
              )}
            >
              {item.done ? <CheckCircle2 className="h-4 w-4" /> : item.step}
            </div>
            <span className={cn("text-xs", item.done ? "text-foreground font-medium" : "text-muted-foreground")}>
              {item.label}
            </span>
            {idx < arr.length - 1 && (
              <div className="flex-1 h-px bg-border" />
            )}
          </div>
        ))}
      </div>

      {/* Upload Form */}
      {canSubmit && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Identity Documents</CardTitle>
            <CardDescription>
              Upload a government-issued ID (National ID or Passport) — front
              &amp; back — plus a selfie holding your ID. Max 5 MB each.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form id="kyc-form" onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700">
                    {success}
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid gap-4 sm:grid-cols-3">
                {DOC_SLOTS.map((slot) => {
                  const file = files[slot.key];
                  const isImage = file && file.type.startsWith("image/");

                  return (
                    <div key={slot.key} className="space-y-1.5">
                      <p className="text-sm font-medium">{slot.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {slot.description}
                      </p>

                      {file ? (
                        // Preview card
                        <div className="relative rounded-xl border bg-muted/30 p-3 flex flex-col gap-2">
                          {isImage ? (
                            <img
                              src={URL.createObjectURL(file)}
                              alt={slot.label}
                              className="w-full h-28 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-full h-28 flex flex-col items-center justify-center rounded-lg bg-muted gap-2">
                              <FileText className="h-8 w-8 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground text-center px-2 truncate max-w-full">
                                {file.name}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            <span className="text-xs text-emerald-700 truncate">
                              {file.name}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(slot.key)}
                            className="absolute top-2 right-2 rounded-full bg-background border p-0.5 hover:bg-destructive hover:text-destructive-foreground transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        // Drop zone
                        <div
                          className={cn(
                            "relative rounded-xl border-2 border-dashed transition-colors cursor-pointer h-36 flex flex-col items-center justify-center gap-2 text-center px-3",
                            isDragging === slot.key
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50 hover:bg-muted/30"
                          )}
                          onClick={() =>
                            fileInputRefs.current[slot.key]?.click()
                          }
                          onDragOver={(e) => {
                            e.preventDefault();
                            setIsDragging(slot.key);
                          }}
                          onDragLeave={() => setIsDragging(null)}
                          onDrop={(e) => handleDrop(e, slot.key)}
                        >
                          <UploadCloud
                            className={cn(
                              "h-7 w-7 transition-colors",
                              isDragging === slot.key
                                ? "text-primary"
                                : "text-muted-foreground"
                            )}
                          />
                          <p className="text-xs text-muted-foreground leading-snug">
                            Click or drag &amp; drop
                            <br />
                            <span className="text-[11px]">
                              JPG, PNG, PDF · max 5 MB
                            </span>
                          </p>
                          <input
                            ref={(el) => {
                              if (el) fileInputRefs.current[slot.key] = el;
                            }}
                            type="file"
                            accept="image/jpeg,image/png,application/pdf"
                            className="sr-only"
                            onChange={(e) =>
                              handleFileSelect(
                                slot.key,
                                e.target.files?.[0] ?? null
                              )
                            }
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <p className="text-xs text-muted-foreground">
                Your documents are encrypted and stored securely. They are only
                accessible to our compliance team for verification purposes.
              </p>
            </form>
          </CardContent>
          <CardFooter className="flex justify-end gap-3 border-t pt-4">
            <Button
              type="submit"
              form="kyc-form"
              disabled={isSubmitting || Object.keys(files).length === 0}
            >
              {isSubmitting ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Submit for Verification
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Requirements info box */}
      <Card className="border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">What we accept</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <p>✅ Algerian National ID card (front + back)</p>
          <p>✅ Valid Passport (photo page)</p>
          <p>✅ Selfie clearly showing your face and the ID document</p>
          <p>❌ Expired documents, photocopies, or screenshots</p>
        </CardContent>
      </Card>
      </div>
      </div>
    </Layout>
  );
}
