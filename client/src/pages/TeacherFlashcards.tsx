import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth-context";
import { insertPackSchema } from "@shared/schema";
import type { Pack } from "@shared/schema";
import { Plus, Edit2, Trash2, BookOpen } from "lucide-react";
import { z } from "zod";

const createPackSchema = insertPackSchema.extend({
  subject: z.string(),
});

export default function TeacherFlashcards() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);

  const { data: packs = [] } = useQuery<Pack[]>({
    queryKey: ["/api/packs"],
    refetchInterval: 2000,
  });

  const form = useForm({
    resolver: zodResolver(createPackSchema),
    defaultValues: {
      title: "",
      description: "",
      subject: user?.subject || "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: z.infer<typeof createPackSchema>) =>
      apiRequest("POST", "/api/packs", { ...data, subject: user?.subject }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/packs"] });
      form.reset();
      setIsCreating(false);
      toast({
        title: "Succès",
        description: "Pack créé avec succès",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/packs/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/packs"] });
      toast({ title: "Succès", description: "Pack supprimé" });
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Mes Flashcards</h1>
        {user && (
          <p className="text-muted-foreground">
            Matière: <strong>{user.subject || "Non assignée"}</strong>
          </p>
        )}
      </div>

      {isCreating && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Créer un nouveau pack</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Titre</FormLabel>
                      <FormControl>
                        <Input placeholder="Titre du pack" {...field} data-testid="input-pack-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Description du pack" {...field} data-testid="input-pack-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-2">
                  <Button type="submit" disabled={createMutation.isPending} data-testid="button-create-pack">
                    Créer
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>
                    Annuler
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {packs.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="space-y-4">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
            <div>
              <h3 className="text-xl font-semibold mb-2">Aucun pack</h3>
              <p className="text-muted-foreground mb-4">Créez votre premier pack de flashcards</p>
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Créer un pack
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {!isCreating && (
            <Button className="mb-6" onClick={() => setIsCreating(true)} data-testid="button-new-pack">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau pack
            </Button>
          )}
          <div className="space-y-4">
            {packs.map((pack) => (
              <Card key={pack.id} className="hover-elevate">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <div className="flex-1">
                    <CardTitle>{pack.title}</CardTitle>
                    <CardDescription>{pack.description}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setLocation(`/pack/${pack.id}`)}
                      data-testid={`button-edit-pack-${pack.id}`}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteMutation.mutate(pack.id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-pack-${pack.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
