import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { apiRequest } from "@/lib/queryClient";
import { loginSchema, type LoginCredentials, type User } from "@shared/schema";
import { GraduationCap } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const { setUser } = useAuth();
  const { toast } = useToast();
  const [setupPasswordUser, setSetupPasswordUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const form = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await apiRequest<{ user: User; token: string; needsPasswordSetup?: boolean }>(
        "POST",
        "/api/login",
        credentials
      );
      return response;
    },
    onSuccess: (data) => {
      localStorage.setItem("token", data.token);
      if (data.needsPasswordSetup) {
        setSetupPasswordUser(data.user);
      } else {
        setUser(data.user);
        toast({
          title: "Connexion réussie",
          description: `Bienvenue, ${data.user.username}!`,
        });
        setLocation("/");
      }
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erreur de connexion",
        description: error.message || "Identifiants invalides. Veuillez réessayer.",
      });
    },
  });

  const setupPasswordMutation = useMutation({
    mutationFn: async () => {
      if (newPassword !== confirmPassword) {
        throw new Error("Les mots de passe ne correspondent pas");
      }
      if (newPassword.length < 6) {
        throw new Error("Le mot de passe doit contenir au moins 6 caractères");
      }
      await apiRequest("POST", "/api/set-password", { newPassword });
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Mot de passe créé",
        description: "Votre mot de passe a été enregistré. Vous êtes maintenant connecté.",
      });
      setSetupPasswordUser(null);
      setUser(setupPasswordUser);
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible de créer le mot de passe",
      });
    },
  });

  const onSubmit = (data: LoginCredentials) => {
    loginMutation.mutate(data);
  };

  const onSetupPassword = () => {
    setupPasswordMutation.mutate();
  };

  if (setupPasswordUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-2">
            <div className="flex justify-center mb-2">
              <div className="gradient-violet-accent p-3 rounded-lg">
                <GraduationCap className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl">Créer un mot de passe</CardTitle>
            <CardDescription>
              Bienvenue {setupPasswordUser.username}! Créez votre mot de passe.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Nouveau mot de passe</label>
                <Input
                  type="password"
                  placeholder="Entrez votre mot de passe"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  data-testid="input-new-password"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Confirmer le mot de passe</label>
                <Input
                  type="password"
                  placeholder="Confirmez votre mot de passe"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  data-testid="input-confirm-password"
                />
              </div>
              <Button
                onClick={onSetupPassword}
                className="gradient-violet-accent text-white border-0 w-full"
                disabled={setupPasswordMutation.isPending}
                data-testid="button-setup-password"
              >
                {setupPasswordMutation.isPending ? "Création..." : "Créer le mot de passe"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <div className="gradient-violet-accent p-3 rounded-lg">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">FlashLearn</CardTitle>
          <CardDescription>
            Connectez-vous pour apprendre avec les cartes flash
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom d'utilisateur</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Entrez votre nom d'utilisateur"
                        data-testid="input-username"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mot de passe</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Entrez votre mot de passe"
                        data-testid="input-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="gradient-violet-accent text-white border-0 w-full"
                disabled={loginMutation.isPending}
                data-testid="button-submit"
              >
                {loginMutation.isPending ? "Connexion..." : "Se connecter"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
