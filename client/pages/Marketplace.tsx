import { Layout } from "@/components/layout/Layout";
import { ListingCard } from "@/components/marketplace/ListingCard";
import { FilterSidebar, FilterState } from "@/components/marketplace/FilterSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { getFilteredListings } from "@/lib/mockListings";

interface Listing {
  id: string;
  title: string;
  description: string;
  askingPrice: number;
  category: string;
  state: string;
  wilaya: string;
  evaluationColor: string;
  evaluationType: string;
  viewCount: number;
  isFeatured: boolean;
  mediaUrls?: string[];
  revenue?: number;
  seller?: {
    firstName?: string;
    lastName?: string;
    isVerifiedBadge?: boolean;
  };
}

const ITEMS_PER_PAGE = 12;

export default function Marketplace() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    states: [],
    minPrice: 0,
    maxPrice: 1000000,
    location: "",
    evaluationType: "",
    featuredOnly: false,
  });

  // Fetch listings from API
  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/listings");
        if (!response.ok) {
          throw new Error("Failed to fetch listings");
        }
        const data = await response.json();
        const listingsArray = data.data || [];

        // Map API response to match ListingCard interface
        const mappedListings = listingsArray.map((listing: any) => ({
          id: listing.id,
          title: listing.title,
          description: listing.description,
          asking_price: listing.askingPrice,
          askingPrice: listing.askingPrice,
          category: listing.category.toLowerCase(),
          state: listing.state.toLowerCase(),
          location: listing.wilaya,
          wilaya: listing.wilaya,
          evaluation_color: listing.evaluationColor.toLowerCase(),
          evaluationColor: listing.evaluationColor.toLowerCase(),
          evaluation_type: listing.evaluationType.toLowerCase(),
          evaluationType: listing.evaluationType.toLowerCase(),
          view_count: listing.viewCount,
          viewCount: listing.viewCount,
          seller_name: listing.seller
            ? `${listing.seller.firstName || ""} ${listing.seller.lastName || ""}`.trim()
            : "Unknown",
          is_verified: listing.seller?.isVerifiedBadge || false,
          is_featured: listing.isFeatured,
          isFeatured: listing.isFeatured,
          image_url: listing.mediaUrls?.[0] || "https://via.placeholder.com/500x300",
          mediaUrls: listing.mediaUrls,
          revenue: listing.revenue,
        }));

        console.log("📦 Fetched listings from database:", listingsArray);
        console.log("📊 Mapped listings:", mappedListings);
        setListings(mappedListings);
        setError(null);
      } catch (err) {
        console.error("❌ Error fetching listings:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  // Get filtered and sorted listings
  const filteredListings = useMemo(() => {
    return getFilteredListings(listings, searchQuery, filters, sortBy);
  }, [listings, searchQuery, filters, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredListings.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIdx = startIdx + ITEMS_PER_PAGE;
  const paginatedListings = filteredListings.slice(startIdx, endIdx);

  const handleReset = () => {
    setFilters({
      categories: [],
      states: [],
      minPrice: 0,
      maxPrice: 1000000,
      location: "",
      evaluationType: "",
      featuredOnly: false,
    });
    setCurrentPage(1);
  };

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  return (
    <Layout>
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Marketplace</h1>
          <p className="text-muted-foreground text-lg">
            Browse {filteredListings.length} verified listings
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <p>Error: {error}</p>
          </div>
        )}

        {/* Search & Sorting Bar */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assets, startups, domains..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {/* Sorting */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full lg:w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="price_asc">Price: Low to High</SelectItem>
              <SelectItem value="price_desc">Price: High to Low</SelectItem>
              <SelectItem value="most_viewed">Most Viewed</SelectItem>
            </SelectContent>
          </Select>

          {/* Mobile Filter Button */}
          <Button
            variant="outline"
            size="icon"
            className="lg:hidden"
            onClick={() => setShowMobileFilters(true)}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Desktop */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-20 space-y-6">
              <FilterSidebar
                filters={filters}
                onFilterChange={handleFilterChange}
                onReset={handleReset}
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground">Loading listings...</p>
              </div>
            ) : paginatedListings.length > 0 ? (
              <>
                {/* Listings Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                  {paginatedListings.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-12 pt-8 border-t border-border">
                    <div className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages} • {filteredListings.length} results
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <div className="flex items-center gap-2">
                        {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                          const pageNum = i + 1;
                          return (
                            <Button
                              key={pageNum}
                              variant={pageNum === currentPage ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(pageNum)}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                        {totalPages > 5 && <span className="text-muted-foreground">...</span>}
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16 space-y-4">
                <h3 className="text-xl font-semibold">No listings found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your filters or search query
                </p>
                <Button onClick={handleReset} variant="outline">
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Sidebar */}
      {showMobileFilters && (
        <FilterSidebar
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleReset}
          isMobile={true}
          onClose={() => setShowMobileFilters(false)}
        />
      )}
    </Layout>
  );
}
