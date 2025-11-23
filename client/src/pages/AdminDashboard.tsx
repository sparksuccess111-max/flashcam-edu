import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, BookOpen, GripVertical } from "lucide-react";
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
  const [draggedPackId, setDraggedPackId] = useState<string | null>(null);
  const [displayedPacks, setDisplayedPacks] = useState<Pack[] | null>(null);
  const [dragOverPackId, setDragOverPackId] = useState<string | null>(null);
  const [swappedPackId, setSwappedPackId] = useState<string | null>(null);

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

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, packId: string) => {
    setDraggedPackId(packId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, targetPackId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    
    if (!draggedPackId || draggedPackId === targetPackId) {
      return;
    }

    // Get the target element to calculate its position
    const targetElement = (e.currentTarget as HTMLElement);
    const rect = targetElement.getBoundingClientRect();
    const twoThirdsPoint = rect.top + (rect.height * 2 / 3);
    
    // Use 2/3 threshold to reduce jitter
    if (e.clientY > twoThirdsPoint) {
      // Cursor is in the lower third - should swap
      if (swappedPackId !== targetPackId) {
        setSwappedPackId(targetPackId);
      }
    } else {
      // Cursor is in the upper two-thirds - no swap yet
      setSwappedPackId(null);
    }
    
    setDragOverPackId(targetPackId);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetPack: Pack) => {
    e.preventDefault();
    if (!draggedPackId || draggedPackId === targetPack.id || swappedPackId !== targetPack.id) {
      setDraggedPackId(null);
      setDragOverPackId(null);
      setSwappedPackId(null);
      return;
    }

    const currentPacks = packsToDisplay;
    const draggedIndex = currentPacks.findIndex(p => p.id === draggedPackId);
    const targetIndex = currentPacks.findIndex(p => p.id === targetPack.id);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedPackId(null);
      setDragOverPackId(null);
      setSwappedPackId(null);
      return;
    }

    // Simple swap - exchange the two packs
    const newPacks = [...currentPacks];
    [newPacks[draggedIndex], newPacks[targetIndex]] = [newPacks[targetIndex], newPacks[draggedIndex]];

    // Update displayed packs with new order values
    const reorderedPacks = newPacks.map((pack, idx) => ({
      ...pack,
      order: idx,
    }));

    setDisplayedPacks(reorderedPacks);

    // Send updates to server
    reorderMutation.mutate(
      reorderedPacks.map(pack => ({ id: pack.id, order: pack.order }))
    );

    setDraggedPackId(null);
    setDragOverPackId(null);
    setSwappedPackId(null);
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
          {allPacks.map((pack) => (
            <div
              key={pack.id}
              draggable
              onDragStart={(e) => handleDragStart(e, pack.id)}
              onDragOver={(e) => handleDragOver(e, pack.id)}
              onDrop={(e) => handleDrop(e, pack)}
              onDragLeave={() => {
                setDragOverPackId(null);
                setSwappedPackId(null);
              }}
              className={`transition-all duration-300 ease-out ${draggedPackId === pack.id ? "relative z-50" : swappedPackId === pack.id ? "opacity-100 scale-100 -translate-y-16" : "opacity-100 scale-100"}`}
            >
            <Card data-testid={`card-pack-${pack.id}`} className={`hover:shadow-md transition-all duration-300 ${draggedPackId === pack.id ? "bg-violet-500 dark:bg-violet-600 text-white dark:text-white border-violet-600" : ""}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <GripVertical className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" data-testid="icon-drag-handle" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
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
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Publier</span>
                      <Switch
                        checked={pack.published}
                        onCheckedChange={() => handleTogglePublish(pack)}
                        data-testid={`switch-publish-${pack.id}`}
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setManagingPackId(pack.id)}
                    data-testid={`button-manage-cards-${pack.id}`}
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Gérer les cartes
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(pack)}
                    data-testid={`button-edit-${pack.id}`}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(pack.id)}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-${pack.id}`}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
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
