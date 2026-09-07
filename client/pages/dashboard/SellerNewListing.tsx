import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getAccessToken } from "@/lib/auth";

export default function SellerNewListing() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "STARTUP",
    state: "IDEA",
    wilaya: "",
    askingPrice: "",
    revenue: "",
    mediaUrl: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = getAccessToken();
      const payload = {
        ...formData,
        askingPrice: Number(formData.askingPrice),
        revenue: formData.revenue ? Number(formData.revenue) : undefined,
        mediaUrls: formData.mediaUrl ? [formData.mediaUrl] : []
      };

      const res = await fetch("/api/listings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create listing");
      }

      toast.success("Listing created successfully!");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="container py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">Create New Listing</h1>
        <div className="bg-card p-6 border rounded-lg shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" value={formData.title} onChange={handleChange} required placeholder="e.g. E-commerce Startup" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" value={formData.description} onChange={handleChange} required placeholder="Describe your asset in detail..." rows={5} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(val) => setFormData({ ...formData, category: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STARTUP">Startup</SelectItem>
                    <SelectItem value="SHARES">Shares</SelectItem>
                    <SelectItem value="DOMAIN">Domain Name</SelectItem>
                    <SelectItem value="PATENT">Patent</SelectItem>
                    <SelectItem value="APP">Mobile App</SelectItem>
                    <SelectItem value="SAAS">SaaS</SelectItem>
                    <SelectItem value="DESIGN">Design Asset</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>State</Label>
                <Select value={formData.state} onValueChange={(val) => setFormData({ ...formData, state: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="State" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FINISHED">Finished</SelectItem>
                    <SelectItem value="IN_EXECUTION">In Execution</SelectItem>
                    <SelectItem value="TESTING">Testing</SelectItem>
                    <SelectItem value="IN_DEVELOPMENT">In Development</SelectItem>
                    <SelectItem value="IDEA">Idea</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="wilaya">Wilaya (Location)</Label>
              <Input id="wilaya" name="wilaya" value={formData.wilaya} onChange={handleChange} required placeholder="e.g. Alger" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="askingPrice">Asking Price (DZD)</Label>
                <Input id="askingPrice" name="askingPrice" type="number" min="0" value={formData.askingPrice} onChange={handleChange} required placeholder="e.g. 500000" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="revenue">Monthly Revenue (Optional, DZD)</Label>
                <Input id="revenue" name="revenue" type="number" min="0" value={formData.revenue} onChange={handleChange} placeholder="e.g. 15000" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mediaUrl">Image URL (Optional)</Label>
              <Input id="mediaUrl" name="mediaUrl" value={formData.mediaUrl} onChange={handleChange} placeholder="https://..." />
            </div>

            <div className="pt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => navigate("/dashboard")}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Creating..." : "Create Listing"}</Button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
