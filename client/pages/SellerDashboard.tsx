import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Plus, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ProductForm } from "@/components/marketplace/ProductForm";
import { getAccessToken } from "@/lib/auth";

interface SellerListing {
  id: string;
  title: string;
  description: string;
  askingPrice: number;
  category: string;
  state: string;
  wilaya: string;
  status: string;
  viewCount: number;
  isFeatured: boolean;
  createdAt: string;
  mediaUrls?: string[];
}

export default function SellerDashboard() {
  const navigate = useNavigate();
  const [listings, setListings] = useState<SellerListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch seller's listings
  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const token = getAccessToken();
      const response = await fetch("/api/users/listings/my-listings", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        navigate("/auth/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch listings");
      }

      const data = await response.json();
      setListings(data.data || []);
      console.log("📦 Seller listings:", data.data);
      setError(null);
    } catch (err) {
      console.error("❌ Error fetching listings:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const token = getAccessToken();
      const response = await fetch(`/api/listings/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Failed to delete listing");
      }

      console.log(`✅ Deleted listing ${id}`);
      setListings(listings.filter((l) => l.id !== id));
    } catch (err) {
      console.error("❌ Error deleting listing:", err);
      alert(err instanceof Error ? err.message : "Failed to delete listing");
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingId(null);
  };

  const handleFormSuccess = () => {
    handleFormClose();
    fetchListings();
  };

  const filteredListings = listings.filter(
    (listing) =>
      listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      <div className="container py-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">My Products</h1>
            <p className="text-muted-foreground">
              Manage your marketplace listings
            </p>
          </div>
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            New Product
          </Button>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <p>Error: {error}</p>
          </div>
        )}

        {/* Product Form Modal */}
        {showForm && (
          <Card className="mb-8 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle>
                {editingId ? "Edit Product" : "Create New Product"}
              </CardTitle>
              <CardDescription>
                Fill in the details below to {editingId ? "update" : "create"} your product listing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProductForm
                listingId={editingId || undefined}
                onSuccess={handleFormSuccess}
                onCancel={handleFormClose}
              />
            </CardContent>
          </Card>
        )}

        {/* Search Bar */}
        {!showForm && listings.length > 0 && (
          <div className="mb-8">
            <Input
              placeholder="Search your products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">Loading your products...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && listings.length === 0 && (
          <Card className="text-center py-16">
            <CardContent>
              <h3 className="text-xl font-semibold mb-2">No products yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first product to get started
              </p>
              <Button onClick={() => setShowForm(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Product
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Products Grid */}
        {!loading && filteredListings.length > 0 && (
          <div className="grid gap-4">
            {filteredListings.map((listing) => (
              <Card key={listing.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      <img
                        src={listing.mediaUrls?.[0] || "https://via.placeholder.com/120x120"}
                        alt={listing.title}
                        className="h-24 w-24 object-cover rounded-lg"
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold truncate">
                            {listing.title}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {listing.description}
                          </p>

                          {/* Badges */}
                          <div className="flex flex-wrap gap-2 mt-3">
                            <Badge variant="secondary">
                              {listing.category.toUpperCase()}
                            </Badge>
                            <Badge
                              variant={
                                listing.status === "ACTIVE"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {listing.status}
                            </Badge>
                            {listing.isFeatured && (
                              <Badge className="bg-yellow-500">Featured</Badge>
                            )}
                          </div>
                        </div>

                        {/* Price & Stats */}
                        <div className="text-right flex-shrink-0">
                          <p className="text-2xl font-bold text-primary">
                            {(listing.askingPrice / 1000000).toFixed(1)}M
                            <span className="text-sm font-normal text-muted-foreground">
                              {" "}
                              DA
                            </span>
                          </p>
                          <p className="text-sm text-muted-foreground flex items-center justify-end gap-1 mt-1">
                            <Eye className="h-3 w-3" />
                            {listing.viewCount} views
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingId(listing.id);
                            setShowForm(true);
                          }}
                          className="gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(listing.id)}
                          className="gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* No Search Results */}
        {!loading && filteredListings.length === 0 && listings.length > 0 && (
          <Card className="text-center py-16">
            <CardContent>
              <h3 className="text-xl font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground">
                No products match your search query
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
