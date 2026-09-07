import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Menu,
  X,
  User,
  LogOut,
  LayoutDashboard,
  Plus,
  ChevronDown,
  Shield,
} from "lucide-react";
import { useState } from "react";
import { useAuth, AuthUser } from "@/lib/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const roleLabels: Record<string, string> = {
  VISITOR: "Visitor",
  BUYER: "Buyer",
  SELLER: "Seller",
  INVESTOR: "Investor",
  EXPERT: "Expert",
  EVALUATION_COMPANY: "Eval. Company",
  NOTARY: "Notary",
  LAWYER: "Lawyer",
  ADMIN: "Admin",
};

const roleBadgeColor: Record<string, string> = {
  BUYER: "bg-blue-500/10 text-blue-600",
  SELLER: "bg-violet-500/10 text-violet-600",
  INVESTOR: "bg-emerald-500/10 text-emerald-600",
  ADMIN: "bg-red-500/10 text-red-600",
  EXPERT: "bg-amber-500/10 text-amber-600",
};

function UserMenu({
  user,
  onLogout,
}: {
  user: AuthUser;
  onLogout: () => void;
}) {
  const displayName =
    user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.email.split("@")[0];

  const initials = user.firstName
    ? `${user.firstName[0]}${user.lastName?.[0] || ""}`
    : user.email[0].toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted/80 transition-colors">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xs font-bold text-white">
            {initials}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <span
              className={`inline-block mt-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                roleBadgeColor[user.role] || "bg-muted text-muted-foreground"
              }`}
            >
              {roleLabels[user.role] || user.role}
            </span>
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <div className="px-2 py-2">
          <p className="text-sm font-medium">{displayName}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/dashboard/settings/kyc" className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            Profile & KYC
          </Link>
        </DropdownMenuItem>
        {(user.role === "BUYER" || user.role === "INVESTOR") && (
          <DropdownMenuItem asChild>
            <Link to="/dashboard/buyer" className="cursor-pointer">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              My Dashboard
            </Link>
          </DropdownMenuItem>
        )}
        {(user.role === "SELLER" || user.role === "ADMIN") && (
          <DropdownMenuItem asChild>
            <Link
              to="/dashboard/seller/new-listing"
              className="cursor-pointer"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Listing
            </Link>
          </DropdownMenuItem>
        )}
        {user.role === "ADMIN" && (
          <DropdownMenuItem asChild>
            <Link to="/admin" className="cursor-pointer">
              <Shield className="mr-2 h-4 w-4" />
              Admin Panel
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onLogout}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 font-bold text-xl">
          <div className="h-8 w-8 bg-gradient-to-br from-primary to-secondary rounded-lg shadow-md shadow-primary/20"></div>
          <span className="hidden sm:inline bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
            AssetHub
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            to="/"
            className="px-3 py-2 text-sm font-medium rounded-lg hover:text-primary hover:bg-primary/5 transition-all"
          >
            Home
          </Link>
          <Link
            to="/marketplace"
            className="px-3 py-2 text-sm font-medium rounded-lg hover:text-primary hover:bg-primary/5 transition-all"
          >
            Marketplace
          </Link>
          <Link
            to="/legal/notaries"
            className="px-3 py-2 text-sm font-medium rounded-lg hover:text-primary hover:bg-primary/5 transition-all"
          >
            Legal Directory
          </Link>
          {isAuthenticated && user?.role === "SELLER" && (
            <Link
              to="/dashboard/seller/new-listing"
              className="px-3 py-2 text-sm font-medium rounded-lg hover:text-primary hover:bg-primary/5 transition-all"
            >
              Sell
            </Link>
          )}
        </nav>

        {/* Right Side */}
        <div className="hidden sm:flex items-center gap-3">
          {isAuthenticated && user ? (
            <UserMenu user={user} onLogout={handleLogout} />
          ) : (
            <>
              <Link to="/auth/login">
                <Button
                  variant="ghost"
                  size="sm"
                  className="font-medium"
                >
                  Sign In
                </Button>
              </Link>
              <Link to="/auth/register">
                <Button
                  size="sm"
                  className="shadow-md shadow-primary/20 font-medium"
                >
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-border bg-card/95 backdrop-blur-xl">
          <nav className="flex flex-col gap-1 p-4">
            <Link
              to="/"
              className="px-3 py-2 text-sm font-medium hover:text-primary transition-colors rounded-lg hover:bg-primary/5"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/marketplace"
              className="px-3 py-2 text-sm font-medium hover:text-primary transition-colors rounded-lg hover:bg-primary/5"
              onClick={() => setIsMenuOpen(false)}
            >
              Marketplace
            </Link>
            <Link
              to="/legal/notaries"
              className="px-3 py-2 text-sm font-medium hover:text-primary transition-colors rounded-lg hover:bg-primary/5"
              onClick={() => setIsMenuOpen(false)}
            >
              Legal Directory
            </Link>

            <div className="flex gap-2 mt-4 pt-4 border-t border-border">
              {isAuthenticated && user ? (
                <>
                  <div className="flex-1 text-sm">
                    <p className="font-medium">
                      {user.firstName || user.email.split("@")[0]}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {roleLabels[user.role] || user.role}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                  >
                    <LogOut className="h-4 w-4 mr-1" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/auth/login" className="flex-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/auth/register" className="flex-1">
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
