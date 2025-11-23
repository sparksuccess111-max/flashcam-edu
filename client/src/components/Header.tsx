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
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-2 hover-elevate active-elevate-2 px-3 py-2 rounded-md bg-transparent border-0 cursor-pointer"
          >
            <GraduationCap className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold">FlashLearn</h1>
          </button>
          
          <div className="flex items-center gap-2">
            {user && isAdmin && (
              <Button
                variant="ghost"
                onClick={() => setLocation("/admin")}
                data-testid="button-admin-dashboard"
              >
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Admin Dashboard
              </Button>
            )}
            {user ? (
              <Button
                variant="ghost"
                onClick={handleLogout}
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            ) : (
              <Button
                variant="default"
                onClick={() => setLocation("/login")}
                data-testid="button-login"
              >
                Login
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
