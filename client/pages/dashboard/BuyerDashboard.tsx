import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingCart, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getAccessToken } from "@/lib/auth";

interface Favorite {
  id: string;
  listing: {
    id: string;
    title: string;
    category: string;
    askingPrice: number;
    mediaUrls: string[];
    seller: {
      id: string;
      firstName: string;
      lastName: string;
      isVerifiedBadge: boolean;
    };
  };
  createdAt: string;
}

interface Transaction {
  id: string;
  listing: {
    id: string;
    title: string;
    category: string;
    mediaUrls: string[];
  };
  seller: {
    id: string;
    firstName: string;
    lastName: string;
  };
  amount: number;
  escrowStatus: string;
  createdAt: string;
}

export default function BuyerDashboard() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"favorites" | "transactions">("favorites");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = getAccessToken();

        const [favRes, txnRes] = await Promise.all([
          fetch("/api/favorites", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/transactions", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!favRes.ok || !txnRes.ok) {
          throw new Error("Failed to fetch data");
        }

        const favData = await favRes.json();
        const txnData = await txnRes.json();

        setFavorites(favData.favorites || []);
        setTransactions([...((txnData.asBuyer as Transaction[]) || [])]);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Buyer Dashboard</h1>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("favorites")}
            className={cn(
              "px-4 py-2 font-medium text-sm border-b-2 transition-colors",
              activeTab === "favorites"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            )}
          >
            <Heart className="inline h-4 w-4 mr-2" />
            Favorites ({favorites.length})
          </button>
          <button
            onClick={() => setActiveTab("transactions")}
            className={cn(
              "px-4 py-2 font-medium text-sm border-b-2 transition-colors",
              activeTab === "transactions"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            )}
          >
            <ShoppingCart className="inline h-4 w-4 mr-2" />
            Transactions ({transactions.length})
          </button>
        </div>

        {/* Favorites Tab */}
        {activeTab === "favorites" && (
          <div>
            {favorites.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No saved favorites yet</p>
                <Link to="/marketplace">
                  <Button>Browse Listings</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favorites.map((fav) => (
                  <div
                    key={fav.id}
                    className="bg-white rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden"
                  >
                    {fav.listing.mediaUrls[0] && (
                      <div className="h-48 bg-gray-200 relative">
                        <img
                          src={fav.listing.mediaUrls[0]}
                          alt={fav.listing.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full">
                          <Heart className="h-4 w-4 fill-current" />
                        </div>
                      </div>
                    )}
                    <div className="p-4">
                      <p className="text-xs text-gray-500 mb-1">
                        {fav.listing.category}
                      </p>
                      <Link
                        to={`/listing/${fav.listing.id}`}
                        className="text-lg font-semibold text-gray-900 hover:text-blue-600 line-clamp-2"
                      >
                        {fav.listing.title}
                      </Link>
                      <p className="text-xl font-bold text-blue-600 mt-2">
                        ${fav.listing.askingPrice.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600 mt-2">
                        Seller: {fav.listing.seller.firstName}{" "}
                        {fav.listing.seller.lastName}
                        {fav.listing.seller.isVerifiedBadge && (
                          <span className="text-blue-600 ml-1">✓</span>
                        )}
                      </p>
                      <Link to={`/listing/${fav.listing.id}`}>
                        <Button className="w-full mt-4">View Listing</Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === "transactions" && (
          <div>
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No transactions yet</p>
                <Link to="/marketplace">
                  <Button>Start Shopping</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((txn) => (
                  <div
                    key={txn.id}
                    className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-4 flex-1">
                        {txn.listing.mediaUrls[0] && (
                          <img
                            src={txn.listing.mediaUrls[0]}
                            alt={txn.listing.title}
                            className="w-24 h-24 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <Link
                            to={`/listing/${txn.listing.id}`}
                            className="text-lg font-semibold text-gray-900 hover:text-blue-600"
                          >
                            {txn.listing.title}
                          </Link>
                          <p className="text-sm text-gray-600 mt-1">
                            Seller: {txn.seller.firstName} {txn.seller.lastName}
                          </p>
                          <p className="text-sm text-gray-600">
                            Category: {txn.listing.category}
                          </p>
                          <p className="text-xl font-bold text-blue-600 mt-2">
                            ${txn.amount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={cn(
                            "inline-block px-3 py-1 rounded-full text-sm font-medium",
                            txn.escrowStatus === "PENDING"
                              ? "bg-yellow-100 text-yellow-800"
                              : txn.escrowStatus === "ESCROW_HELD"
                              ? "bg-blue-100 text-blue-800"
                              : txn.escrowStatus === "COMPLETED"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          )}
                        >
                          {txn.escrowStatus}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(txn.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
