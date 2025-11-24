import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { NotificationProvider } from "@/lib/notification-context";
import { useWebSocket } from "@/lib/websocket";
import { Header } from "@/components/Header";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Home from "@/pages/Home";
import PackView from "@/pages/PackView";
import AdminDashboard from "@/pages/AdminDashboard";
import TeacherDashboard from "@/pages/TeacherDashboard";
import Messages from "@/pages/Messages";
import TeacherFlashcards from "@/pages/TeacherFlashcards";
import AdminFlashcards from "@/pages/AdminFlashcards";

function ProtectedRoute({ component: Component, adminOnly = false, teacherOrAdminOnly = false }: { component: () => JSX.Element; adminOnly?: boolean; teacherOrAdminOnly?: boolean }) {
  const { user, isAdmin } = useAuth();

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (adminOnly && !isAdmin) {
    return <Redirect to="/" />;
  }

  if (teacherOrAdminOnly && user.role !== "teacher" && user.role !== "admin") {
    return <Redirect to="/" />;
  }

  return <Component />;
}

function Router() {
  useWebSocket();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Switch>
          <Route path="/login" component={Login} />
          <Route path="/signup" component={Signup} />
          <Route path="/" component={Home} />
          <Route path="/pack/:id" component={PackView} />
          <Route path="/admin">
            {() => <ProtectedRoute component={AdminDashboard} adminOnly />}
          </Route>
          <Route path="/teacher">
            {() => <ProtectedRoute component={TeacherDashboard} teacherOrAdminOnly />}
          </Route>
          <Route path="/messages">
            {() => <ProtectedRoute component={Messages} />}
          </Route>
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <NotificationProvider>
            <Router />
            <Toaster />
          </NotificationProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
