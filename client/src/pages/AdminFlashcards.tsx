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
import type { Pack } from "@shared/schema";
import { Plus, Edit2, Trash2, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { z } from "zod";

const createPackSchema = insertPackSchema;

export default function AdminFlashcards() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());

  const { data: packs = [] } = useQuery<Pack[]>({
    queryKey: ["/api/packs"],
    refetchInterval: 2000,
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

  // Group packs by subject
  const packsGroupedBySubject = SUBJECTS.reduce((acc, subject) => {
    acc[subject] = packs.filter(p => p.subject === subject);
    return acc;
  }, {} as Record<string, Pack[]>);

  const toggleSubject = (subject: string) => {
    const newExpanded = new Set(expandedSubjects);
    if (newExpanded.has(subject)) {
      newExpanded.delete(subject);
    } else {
      newExpanded.add(subject);
    }
    setExpandedSubjects(newExpanded);
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
        <div className="space-y-4">
          {SUBJECTS.map(subject => {
            const subjectPacks = packsGroupedBySubject[subject] || [];
            const isExpanded = expandedSubjects.has(subject);

            return (
              <div key={subject}>
                <button
                  onClick={() => toggleSubject(subject)}
                  className="w-full flex items-center gap-2 p-3 rounded-md bg-muted hover-elevate transition-colors text-left"
                  data-testid={`button-toggle-subject-${subject}`}
                >
                  {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  <span className="font-semibold">{subject}</span>
                  <span className="text-sm text-muted-foreground ml-auto">({subjectPacks.length})</span>
                </button>

                {isExpanded && (
                  <div className="ml-4 mt-3 space-y-3 pl-4 border-l-2 border-muted">
                    {subjectPacks.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-2">Aucun pack pour cette matière</p>
                    ) : (
                      subjectPacks.map(pack => (
                        <Card key={pack.id} className="hover-elevate">
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 p-4">
                            <div className="flex-1">
                              <CardTitle className="text-base">{pack.title}</CardTitle>
                              <CardDescription className="text-sm">{pack.description}</CardDescription>
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
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
