import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth, getAccessToken } from "@/lib/auth";
import { toast } from "sonner";
import { Building, MapPin, Eye, Info } from "lucide-react";

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true);
        const token = getAccessToken();
        const headers: Record<string, string> = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        
        const res = await fetch(`/api/listings/${id}`, { headers });
        if (!res.ok) {
          throw new Error("Failed to load listing");
        }
        
        const data = await res.json();
        setListing(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchListing();
    }
  }, [id]);

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      toast.error("Veuillez vous connecter pour acheter.");
      navigate("/auth/login");
      return;
    }

    try {
      setIsProcessing(true);
      const token = getAccessToken();
      const res = await fetch("/api/transactions/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ listingId: id })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Une erreur est survenue lors de l'achat.");
      }

      toast.success("Achat initié avec succès ! (Paiement à la livraison)");
      setIsCheckoutOpen(false);
      
      // Navigate to buyer dashboard to see the transaction
      navigate("/dashboard/buyer");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </Layout>
    );
  }

  if (error || !listing) {
    return (
      <Layout>
        <div className="container py-16 text-center text-red-500">
          <p>{error || "Annonce introuvable"}</p>
          <Button onClick={() => navigate("/marketplace")} className="mt-4">
            Retour au Marketplace
          </Button>
        </div>
      </Layout>
    );
  }

  const isSeller = user?.id === listing.seller?.id;
  const canBuy = listing.status === "ACTIVE" && !isSeller;

  return (
    <Layout>
      <div className="container py-8 max-w-4xl">
        <div className="bg-card border rounded-lg overflow-hidden shadow-sm">
          {/* Header */}
          <div className="p-6 border-b">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold mb-2">{listing.title}</h1>
                <div className="flex items-center gap-4 text-muted-foreground mb-4">
                  <span className="flex items-center gap-1"><Building className="h-4 w-4"/> {listing.category}</span>
                  <span className="flex items-center gap-1"><MapPin className="h-4 w-4"/> {listing.wilaya}</span>
                  <span className="flex items-center gap-1"><Eye className="h-4 w-4"/> {listing.viewCount} vues</span>
                </div>
                <div className="flex gap-2">
                  <Badge variant="secondary">{listing.state}</Badge>
                  <Badge variant="outline">{listing.status}</Badge>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary mb-2">
                  {listing.askingPrice.toLocaleString()} DZD
                </div>
                {canBuy && (
                  <Button size="lg" onClick={() => setIsCheckoutOpen(true)}>
                    Acheter (COD)
                  </Button>
                )}
                {isSeller && (
                  <div className="mt-2 text-sm text-muted-foreground">Ceci est votre annonce</div>
                )}
              </div>
            </div>
          </div>

          {/* Media */}
          {listing.mediaUrls && listing.mediaUrls.length > 0 && (
            <div className="p-6 border-b bg-muted/30">
              <img 
                src={listing.mediaUrls[0]} 
                alt={listing.title} 
                className="w-full max-h-[400px] object-cover rounded-md"
              />
            </div>
          )}

          {/* Description */}
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold mb-4">Description</h2>
            <p className="whitespace-pre-wrap text-muted-foreground">
              {listing.description}
            </p>
          </div>

          {/* Details */}
          <div className="p-6 bg-muted/10 grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-1">Vendeur</h3>
              <p className="font-medium">{listing.seller?.firstName} {listing.seller?.lastName}</p>
            </div>
            {listing.revenue && (
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-1">Revenu Mensuel</h3>
                <p className="font-medium">{listing.revenue.toLocaleString()} DZD</p>
              </div>
            )}
            {listing.initialInvestment && (
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-1">Investissement Initial</h3>
                <p className="font-medium">{listing.initialInvestment.toLocaleString()} DZD</p>
              </div>
            )}
            {listing.teamSize && (
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-1">Taille de l'équipe</h3>
                <p className="font-medium">{listing.teamSize} personnes</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la commande</DialogTitle>
            <DialogDescription>
              Vous êtes sur le point d'acheter <strong>{listing.title}</strong> au prix de <strong>{listing.askingPrice?.toLocaleString()} DZD</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted p-4 rounded-md flex items-start gap-3 my-4">
            <Info className="h-5 w-5 text-primary mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Paiement à la livraison (COD)</p>
              <p className="text-muted-foreground">Le paiement s'effectuera lors de la finalisation avec le vendeur ou le notaire.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCheckoutOpen(false)} disabled={isProcessing}>
              Annuler
            </Button>
            <Button onClick={handleCheckout} disabled={isProcessing}>
              {isProcessing ? "Traitement..." : "Confirmer l'achat"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
