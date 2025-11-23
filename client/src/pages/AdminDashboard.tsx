import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, BookOpen, ChevronUp, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Pack } from "@shared/schema";
import { PackDialog } from "@/components/PackDialog";
import { FlashcardManager } from "@/components/FlashcardManager";

export default function AdminDashboard() {
  const { toast } = useToast();
  const [editingPack, setEditingPack] = useState<Pack | null>(null);
  const [isPackDialogOpen, setIsPackDialogOpen] = useState(false);
  const [managingPackId, setManagingPackId] = useState<string | null>(null);
  const [displayedPacks, setDisplayedPacks] = useState<Pack[] | null>(null);
  const [animatingPackId, setAnimatingPackId] = useState<string | null>(null);

  const { data: packs, isLoading } = useQuery<Pack[]>({
    queryKey: ["/api/packs"],
  });

  // Sync displayed packs with server data
  const packsToDisplay = displayedPacks !== null ? displayedPacks : (packs || []);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/packs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/packs"] });
      toast({
        title: "Pack supprimé",
        description: "Le pack a été supprimé avec succès.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de supprimer le pack. Veuillez réessayer.",
      });
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: ({ id, published }: { id: string; published: boolean }) =>
      apiRequest("PATCH", `/api/packs/${id}`, { published }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/packs"] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de mettre à jour le statut du pack.",
      });
    },
  });

  const handleEdit = (pack: Pack) => {
    setEditingPack(pack);
    setIsPackDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingPack(null);
    setIsPackDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce pack? Cela supprimera également toutes ses cartes.")) {
      deleteMutation.mutate(id);
    }
  };

  const handleTogglePublish = (pack: Pack) => {
    togglePublishMutation.mutate({ id: pack.id, published: !pack.published });
  };

  const reorderMutation = useMutation({
    mutationFn: async (packsWithNewOrder: Array<{ id: string; order: number }>) => {
      // Send all pack updates in parallel
      await Promise.all(
        packsWithNewOrder.map(({ id, order }) =>
          apiRequest("PATCH", `/api/packs/${id}`, { order })
        )
      );
    },
    onSuccess: () => {
      setDisplayedPacks(null); // Clear local state to refresh from server
      queryClient.invalidateQueries({ queryKey: ["/api/packs"] });
    },
    onError: () => {
      setDisplayedPacks(null); // Reset on error
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de réorganiser les packs.",
      });
    },
  });

  const handleMoveUp = (packId: string) => {
    const index = packsToDisplay.findIndex(p => p.id === packId);
    if (index === 0) return;

    const newPacks = [...packsToDisplay];
    [newPacks[index - 1], newPacks[index]] = [newPacks[index], newPacks[index - 1]];
    setDisplayedPacks(newPacks);
    setAnimatingPackId(packId);
    setTimeout(() => setAnimatingPackId(null), 300);

    reorderMutation.mutate(
      newPacks.map((pack, i) => ({ id: pack.id, order: i }))
    );
  };

  const handleMoveDown = (packId: string) => {
    const index = packsToDisplay.findIndex(p => p.id === packId);
    if (index === packsToDisplay.length - 1) return;

    const newPacks = [...packsToDisplay];
    [newPacks[index], newPacks[index + 1]] = [newPacks[index + 1], newPacks[index]];
    setDisplayedPacks(newPacks);
    setAnimatingPackId(packId);
    setTimeout(() => setAnimatingPackId(null), 300);

    reorderMutation.mutate(
      newPacks.map((pack, i) => ({ id: pack.id, order: i }))
    );
  };

  const allPacks = packsToDisplay;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-10 w-64 mb-8" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (managingPackId) {
    return (
      <FlashcardManager
        packId={managingPackId}
        onClose={() => setManagingPackId(null)}
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400 bg-clip-text text-transparent">Tableau de bord</h1>
          <p className="text-muted-foreground">
            Gérez vos packs de flashcard et le contenu
          </p>
        </div>
        <Button className="gradient-violet-accent text-white border-0" onClick={handleCreate} data-testid="button-create-pack">
          <Plus className="h-4 w-4 mr-2" />
          Créer un pack
        </Button>
      </div>

      {allPacks.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <div className="bg-muted p-4 rounded-full">
                <BookOpen className="h-12 w-12 text-muted-foreground" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Aucun paquet pour le moment</h3>
              <p className="text-muted-foreground mb-4">
                Commencez par créer votre premier paquet de cartes
              </p>
              <Button className="gradient-violet-accent text-white border-0" onClick={handleCreate} data-testid="button-create-first-pack">
                <Plus className="h-4 w-4 mr-2" />
                Créer votre premier paquet
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {allPacks.map((pack, idx) => (
            <div
              key={pack.id}
              className={`transition-all duration-300 ease-out ${animatingPackId === pack.id ? "scale-95 opacity-75" : "scale-100 opacity-100"}`}
            >
              <Card data-testid={`card-pack-${pack.id}`} className="hover:shadow-md transition-all duration-300">
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <CardTitle className="break-words" data-testid={`text-pack-title-${pack.id}`}>
                          {pack.title}
                        </CardTitle>
                        <Badge variant={pack.published ? "default" : "secondary"} data-testid={`badge-status-${pack.id}`}>
                          {pack.published ? "Publié" : "Brouillon"}
                        </Badge>
                      </div>
                      <CardDescription className="break-words" data-testid={`text-pack-description-${pack.id}`}>
                        {pack.description || "Pas de description"}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm text-muted-foreground whitespace-nowrap">Publier</span>
                      <Switch
                        checked={pack.published}
                        onCheckedChange={() => handleTogglePublish(pack)}
                        data-testid={`switch-publish-${pack.id}`}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMoveUp(pack.id)}
                      disabled={idx === 0}
                      data-testid={`button-move-up-${pack.id}`}
                      className="w-full md:w-auto"
                    >
                      <ChevronUp className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Monter</span>
                      <span className="sm:hidden">↑</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMoveDown(pack.id)}
                      disabled={idx === allPacks.length - 1}
                      data-testid={`button-move-down-${pack.id}`}
                      className="w-full md:w-auto"
                    >
                      <ChevronDown className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Descendre</span>
                      <span className="sm:hidden">↓</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setManagingPackId(pack.id)}
                      data-testid={`button-manage-cards-${pack.id}`}
                      className="w-full md:w-auto"
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Gérer</span>
                      <span className="sm:hidden">📚</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(pack)}
                      data-testid={`button-edit-${pack.id}`}
                      className="w-full md:w-auto"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Modifier</span>
                      <span className="sm:hidden">✏️</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(pack.id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-${pack.id}`}
                      className="w-full md:w-auto"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Supprimer</span>
                      <span className="sm:hidden">🗑️</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}

      <PackDialog
        pack={editingPack}
        open={isPackDialogOpen}
        onOpenChange={setIsPackDialogOpen}
      />
    </div>
  );
}
