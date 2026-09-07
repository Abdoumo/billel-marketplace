import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Pages
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";

// Auth Pages
import Register from "./pages/auth/Register";
import Login from "./pages/auth/Login";
import VerifyEmail from "./pages/auth/VerifyEmail";

// Marketplace Pages
import Marketplace from "./pages/Marketplace";
import ListingDetail from "./pages/ListingDetail";

// Dashboard Pages
import SellerDashboard from "./pages/SellerDashboard";
import SellerNewListing from "./pages/dashboard/SellerNewListing";
import BuyerDashboard from "./pages/dashboard/BuyerDashboard";
import SettingsKyc from "./pages/dashboard/SettingsKyc";

// Other Pages
import Evaluation from "./pages/Evaluation";

// Legal Pages
import Notaries from "./pages/legal/Notaries";
import Lawyers from "./pages/legal/Lawyers";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminOrders from "./pages/admin/Orders";
import AdminUsers from "./pages/admin/Users";
import AdminListings from "./pages/admin/Listings";
import AdminKyc from "./pages/admin/Kyc";
import AdminReports from "./pages/admin/Reports";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Home */}
          <Route path="/" element={<Home />} />

          {/* Auth Routes */}
          <Route path="/auth/register" element={<Register />} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/verify-email" element={<VerifyEmail />} />

          {/* Marketplace Routes */}
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/listing/:id" element={<ListingDetail />} />

          {/* Dashboard Routes */}
          <Route path="/dashboard" element={<SellerDashboard />} />
          <Route path="/dashboard/buyer" element={<BuyerDashboard />} />
          <Route path="/dashboard/seller/new-listing" element={<SellerNewListing />} />
          <Route path="/dashboard/settings/kyc" element={<SettingsKyc />} />

          {/* Other Routes */}
          <Route path="/evaluation" element={<Evaluation />} />

          {/* Legal Routes */}
          <Route path="/legal/notaries" element={<Notaries />} />
          <Route path="/legal/lawyers" element={<Lawyers />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/listings" element={<AdminListings />} />
          <Route path="/admin/kyc" element={<AdminKyc />} />
          <Route path="/admin/reports" element={<AdminReports />} />

          {/* Catch-all 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
