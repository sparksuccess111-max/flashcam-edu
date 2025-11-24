import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, LogOut, LayoutDashboard, MessageSquare } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export function Header() {
  const { user, logout, isAdmin } = useAuth();
  const [, setLocation] = useLocation();
  const isTeacher = user?.role === "teacher";

  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ["/api/messages/unread-count"],
    refetchInterval: 2000,
    enabled: !!user,
  });

  const unreadCount = unreadData?.count || 0;

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
            {user && (isAdmin || isTeacher) && (
              <Button
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                variant="outline"
                onClick={() => setLocation(isAdmin ? "/admin" : "/teacher")}
                data-testid="button-dashboard"
              >
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Tableau de bord
              </Button>
            )}
            {user && (
              <Button
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm relative"
                variant="outline"
                onClick={() => setLocation("/messages")}
                data-testid="button-messages"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Messages
                {unreadCount > 0 && (
                  <Badge 
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-red-500 text-white border-0 text-xs"
                    data-testid="badge-unread-messages"
                  >
                    {unreadCount}
                  </Badge>
                )}
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
