import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { GraduationCap, LogOut, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export function Header() {
  const { user, logout, isAdmin } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  return (
    <header className="gradient-header border-b shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-2 hover-elevate active-elevate-2 px-3 py-2 rounded-md bg-white/10 backdrop-blur-sm border-0 cursor-pointer text-white"
          >
            <GraduationCap className="h-6 w-6" />
            <h1 className="text-xl font-semibold">FlashCamEdu</h1>
          </button>
          
          <div className="flex items-center gap-2">
            {user && isAdmin && (
              <Button
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                variant="outline"
                onClick={() => setLocation("/admin")}
                data-testid="button-admin-dashboard"
              >
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Tableau de bord
              </Button>
            )}
            {user ? (
              <Button
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                variant="outline"
                onClick={handleLogout}
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </Button>
            ) : (
              <Button
                className="bg-white text-violet-600 hover:bg-white/90"
                variant="default"
                onClick={() => setLocation("/login")}
                data-testid="button-login"
              >
                Se connecter
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
