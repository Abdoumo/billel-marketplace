import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { getAccessToken } from "@/lib/auth";

interface ProductFormProps {
  listingId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormData {
  title: string;
  description: string;
  category: string;
  state: string;
  wilaya: string;
  askingPrice: string;
  initialInvestment: string;
  revenue: string;
  teamSize: string;
  monthlyCampaigners: string;
  evaluationType: string;
  mediaUrls: string[];
}

const CATEGORIES = [
  { value: "STARTUP", label: "Startup" },
  { value: "SHARES", label: "Equity/Shares" },
  { value: "DOMAIN", label: "Domain" },
  { value: "PATENT", label: "Patent" },
  { value: "APP", label: "App" },
  { value: "SAAS", label: "SaaS" },
  { value: "DESIGN", label: "Design" },
];

const STATES = [
  { value: "FINISHED", label: "Finished" },
  { value: "IN_EXECUTION", label: "In Execution" },
  { value: "TESTING", label: "Testing" },
  { value: "IN_DEVELOPMENT", label: "In Development" },
  { value: "IDEA", label: "Idea" },
];

const EVALUATION_TYPES = [
  { value: "SELF", label: "Self-Estimated" },
  { value: "LOCAL_EXPERT", label: "Local Expert" },
  { value: "CERTIFIED", label: "Certified" },
];

export function ProductForm({ listingId, onSuccess, onCancel }: ProductFormProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    category: "STARTUP",
    state: "FINISHED",
    wilaya: "Alger",
    askingPrice: "",
    initialInvestment: "",
    revenue: "",
    teamSize: "",
    monthlyCampaigners: "",
    evaluationType: "SELF",
    mediaUrls: [],
  });

  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    if (listingId) {
      loadListing(listingId);
    }
  }, [listingId]);

  const loadListing = async (id: string) => {
    try {
      const response = await fetch(`/api/listings/${id}`);
      if (!response.ok) throw new Error("Failed to load listing");

      const listing = await response.json();
      setFormData({
        title: listing.title,
        description: listing.description,
        category: listing.category,
        state: listing.state,
        wilaya: listing.wilaya,
        askingPrice: listing.askingPrice?.toString() || "",
        initialInvestment: listing.initialInvestment?.toString() || "",
        revenue: listing.revenue?.toString() || "",
        teamSize: listing.teamSize?.toString() || "",
        monthlyCampaigners: listing.monthlyCampaigners?.toString() || "",
        evaluationType: listing.evaluationType,
        mediaUrls: listing.mediaUrls || [],
      });
    } catch (err) {
      console.error("❌ Error loading listing:", err);
      setError(err instanceof Error ? err.message : "Failed to load listing");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const nextStep = () => {
    setError(null);
    // Simple frontend validation per step
    if (step === 1) {
      if (!formData.title || !formData.description) return setError("Title and description required.");
    }
    if (step === 2) {
      if (!formData.askingPrice) return setError("Asking price is required.");
    }
    setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step !== 5) return nextStep();
    
    setLoading(true);
    setError(null);

    try {
      const token = getAccessToken();
      let uploadedUrls = [...formData.mediaUrls];

      // Upload files if any
      if (files.length > 0) {
        const fileData = new FormData();
        files.forEach((file) => fileData.append("files", file));
        
        const uploadRes = await fetch("/api/uploads", {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` },
          body: fileData
        });
        if (!uploadRes.ok) throw new Error("File upload failed");
        
        const uploadData = await uploadRes.json();
        uploadedUrls = [...uploadedUrls, ...uploadData.urls];
      }
      
      if (uploadedUrls.length === 0) uploadedUrls = ["https://via.placeholder.com/500x300"];

      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        state: formData.state,
        wilaya: formData.wilaya,
        askingPrice: parseFloat(formData.askingPrice),
        initialInvestment: formData.initialInvestment ? parseFloat(formData.initialInvestment) : undefined,
        revenue: formData.revenue ? parseFloat(formData.revenue) : undefined,
        teamSize: formData.teamSize ? parseInt(formData.teamSize) : undefined,
        monthlyCampaigners: formData.monthlyCampaigners ? parseInt(formData.monthlyCampaigners) : undefined,
        evaluationType: formData.evaluationType,
        mediaUrls: uploadedUrls,
      };

      const url = listingId ? `/api/listings/${listingId}` : "/api/listings";
      const method = listingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `Failed to ${listingId ? "update" : "create"} listing`);
      }

      onSuccess();
    } catch (err) {
      console.error("❌ Error submitting form:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}
      
      {/* Step Indicator */}
      <div className="flex gap-2 mb-6">
        {[1, 2, 3, 4, 5].map((s) => (
          <div key={s} className={`h-2 flex-1 rounded-full ${step >= s ? "bg-primary" : "bg-muted"}`} />
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4 animate-in fade-in">
          <h3 className="text-lg font-semibold">Step 1: Informations Générales</h3>
          <div className="space-y-2">
            <Label>Product Title *</Label>
            <Input name="title" value={formData.title} onChange={handleChange} required />
          </div>
          <div className="space-y-2">
            <Label>Description *</Label>
            <Textarea name="description" value={formData.description} onChange={handleChange} rows={4} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={formData.category} onValueChange={(v) => handleSelectChange("category", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>State *</Label>
              <Select value={formData.state} onValueChange={(v) => handleSelectChange("state", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Wilaya *</Label>
              <Input name="wilaya" value={formData.wilaya} onChange={handleChange} placeholder="e.g. Alger" required />
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4 animate-in fade-in">
          <h3 className="text-lg font-semibold">Step 2: Données Financières</h3>
          <div className="space-y-2">
            <Label>Asking Price (DA) *</Label>
            <Input name="askingPrice" type="number" value={formData.askingPrice} onChange={handleChange} required />
          </div>
          <div className="space-y-2">
            <Label>Initial Investment (DA)</Label>
            <Input name="initialInvestment" type="number" value={formData.initialInvestment} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label>Monthly Revenue (DA)</Label>
            <Input name="revenue" type="number" value={formData.revenue} onChange={handleChange} />
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4 animate-in fade-in">
          <h3 className="text-lg font-semibold">Step 3: Données Opérationnelles</h3>
          <div className="space-y-2">
            <Label>Monthly Customers</Label>
            <Input name="monthlyCampaigners" type="number" value={formData.monthlyCampaigners} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label>Team Size</Label>
            <Input name="teamSize" type="number" value={formData.teamSize} onChange={handleChange} />
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4 animate-in fade-in">
          <h3 className="text-lg font-semibold">Step 4: Médias et Documents</h3>
          <div className="space-y-2">
            <Label>Upload Images/Docs (Will be sent to S3)</Label>
            <Input type="file" multiple onChange={handleFileChange} accept="image/*,application/pdf" />
          </div>
          {formData.mediaUrls.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {formData.mediaUrls.length} existing files attached.
            </div>
          )}
        </div>
      )}

      {step === 5 && (
        <div className="space-y-4 animate-in fade-in">
          <h3 className="text-lg font-semibold">Step 5: Évaluation</h3>
          <div className="space-y-2">
            <Label>Type d'évaluation *</Label>
            <Select value={formData.evaluationType} onValueChange={(v) => handleSelectChange("evaluationType", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{EVALUATION_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t">
        {step > 1 && (
          <Button type="button" variant="outline" onClick={prevStep} disabled={loading}>
            Back
          </Button>
        )}
        <Button type="submit" disabled={loading} className="flex-1 gap-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {step === 5 ? (listingId ? "Update Product" : "Create Product") : "Next Step"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
