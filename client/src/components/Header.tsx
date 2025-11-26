import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { GraduationCap, LogOut, LayoutDashboard, MessageSquare } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/notification-context";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Header() {
  const { user, logout, isAdmin } = useAuth();
  const [, setLocation] = useLocation();
  const { unreadCount } = useNotifications();
  const isTeacher = user?.role === "teacher";

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  return (
    <header className="gradient-header border-b shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-2 md:gap-4 flex-wrap">
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-1 md:gap-2 hover-elevate active-elevate-2 px-2 md:px-3 py-2 rounded-md bg-white/10 backdrop-blur-sm border-0 cursor-pointer text-white"
          >
            <GraduationCap className="h-5 md:h-6 w-5 md:w-6" />
            <h1 className="text-lg md:text-xl font-semibold hidden sm:inline">FlashCamEdu</h1>
          </button>
          
          <div className="flex items-center gap-1 md:gap-2 flex-wrap justify-end">
            <ThemeToggle />
            {user && (isAdmin || isTeacher) && (
              <Button
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                variant="outline"
                size="sm"
                onClick={() => setLocation(isAdmin ? "/admin" : "/teacher")}
                data-testid="button-dashboard"
              >
                <LayoutDashboard className="h-4 w-4 md:mr-1" />
                <span className="hidden md:inline">Tableau</span>
              </Button>
            )}
            {user && (
              <div className="relative">
                <Button
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                  variant="outline"
                  size="sm"
                  onClick={() => setLocation("/messages")}
                  data-testid="button-messages"
                >
                  <MessageSquare className="h-4 w-4 md:mr-1" />
                  <span className="hidden md:inline">Messages</span>
                </Button>
                {unreadCount > 0 && (
                  <div
                    className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"
                    data-testid="badge-unread-messages"
                  />
                )}
              </div>
            )}
            {user ? (
              <Button
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                variant="outline"
                size="sm"
                onClick={handleLogout}
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4 md:mr-1" />
                <span className="hidden md:inline">Déconnexion</span>
              </Button>
            ) : (
              <Button
                className="bg-white text-violet-600 hover:bg-white/90"
                variant="default"
                size="sm"
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
