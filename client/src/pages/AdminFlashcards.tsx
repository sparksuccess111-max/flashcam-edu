import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertPackSchema, SUBJECTS } from "@shared/schema";
import type { Pack, User } from "@shared/schema";
import { Plus, Edit2, Trash2, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { z } from "zod";

const createPackSchema = insertPackSchema;

interface PackWithCreator extends Pack {
  creator?: User | null;
}

export default function AdminFlashcards() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const { data: packs = [] } = useQuery<PackWithCreator[]>({
    queryKey: ["/api/packs"],
    refetchInterval: 2000,
  });

  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const form = useForm({
    resolver: zodResolver(createPackSchema),
    defaultValues: {
      title: "",
      description: "",
      subject: SUBJECTS[0],
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: z.infer<typeof createPackSchema>) =>
      apiRequest("POST", "/api/packs", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/packs"] });
      form.reset({ subject: SUBJECTS[0] });
      setIsCreating(false);
      toast({ title: "Succès", description: "Pack créé" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/packs/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/packs"] });
      toast({ title: "Succès", description: "Pack supprimé" });
    },
  });

  // Create a map of userId to user
  const userMap = allUsers.reduce((acc, user) => {
    acc[user.id] = user;
    return acc;
  }, {} as Record<string, User>);

  // Enhance packs with creator info
  const enhancedPacks = packs.map(pack => ({
    ...pack,
    creator: pack.createdByUserId ? userMap[pack.createdByUserId] : null,
  }));

  // Group packs by subject, then separate "Autres Packs de cours" (no creator)
  const packsGroupedBySubject = SUBJECTS.reduce((acc, subject) => {
    const subjectPacks = enhancedPacks.filter(p => p.subject === subject);
    const withCreator = subjectPacks.filter(p => p.creator);
    acc[subject] = withCreator;
    return acc;
  }, {} as Record<string, PackWithCreator[]>);

  const otherPacks = enhancedPacks.filter(p => !p.creator);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Flashcards (Administrateur)</h1>
        <p className="text-muted-foreground">Gérez tous les packs de toutes les matières</p>
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
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Matière</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger data-testid="select-subject">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SUBJECTS.map(subject => (
                            <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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

      {!isCreating && (
        <Button className="mb-6" onClick={() => setIsCreating(true)} data-testid="button-new-pack">
          <Plus className="h-4 w-4 mr-2" />
          Nouveau pack
        </Button>
      )}

      {packs.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="space-y-4">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
            <div>
              <h3 className="text-xl font-semibold mb-2">Aucun pack</h3>
              <p className="text-muted-foreground">Créez votre premier pack de flashcards</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Packs with creators grouped by subject */}
          {SUBJECTS.map(subject => {
            const subjectPacks = packsGroupedBySubject[subject] || [];
            if (subjectPacks.length === 0) return null;

            const isExpanded = expandedSections.has(subject);

            return (
              <div key={subject}>
                <button
                  onClick={() => toggleSection(subject)}
                  className="w-full flex items-center gap-2 p-3 rounded-md bg-gradient-to-r from-violet-100 to-purple-100 dark:from-violet-900 dark:to-purple-900 hover-elevate transition-colors text-left"
                  data-testid={`button-toggle-subject-${subject}`}
                >
                  {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  <span className="font-semibold text-lg">{subject}</span>
                  <span className="text-sm text-muted-foreground ml-auto">({subjectPacks.length})</span>
                </button>

                {isExpanded && (
                  <div className="mt-3 space-y-3 pl-4 border-l-2 border-violet-300 dark:border-violet-700">
                    {subjectPacks.map(pack => (
                      <Card key={pack.id} className="hover-elevate">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 p-4">
                          <div className="flex-1">
                            <CardTitle className="text-base">{pack.title}</CardTitle>
                            <CardDescription className="text-sm">{pack.description}</CardDescription>
                            {pack.creator && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Par: {pack.creator.firstName} {pack.creator.lastName}
                              </p>
                            )}
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
                )}
              </div>
            );
          })}

          {/* Other packs (no creator) */}
          {otherPacks.length > 0 && (
            <div>
              <button
                onClick={() => toggleSection("autres")}
                className="w-full flex items-center gap-2 p-3 rounded-md bg-gray-100 dark:bg-gray-800 hover-elevate transition-colors text-left"
                data-testid="button-toggle-autres"
              >
                {expandedSections.has("autres") ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                <span className="font-semibold text-lg">Autres Packs de cours</span>
                <span className="text-sm text-muted-foreground ml-auto">({otherPacks.length})</span>
              </button>

              {expandedSections.has("autres") && (
                <div className="mt-3 space-y-3 pl-4 border-l-2 border-gray-300 dark:border-gray-700">
                  {otherPacks.map(pack => (
                    <Card key={pack.id} className="hover-elevate">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 p-4">
                        <div className="flex-1">
                          <CardTitle className="text-base">{pack.title}</CardTitle>
                          <CardDescription className="text-sm">{pack.description}</CardDescription>
                          <p className="text-xs text-muted-foreground mt-1">
                            Matière: {pack.subject}
                          </p>
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
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
