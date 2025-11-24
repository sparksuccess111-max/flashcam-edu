import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, BookOpen, ChevronUp, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Pack } from "@shared/schema";
import { PackDialog } from "@/components/PackDialog";
import { FlashcardManager } from "@/components/FlashcardManager";

export default function TeacherDashboard() {
  const { toast } = useToast();
  const [editingPack, setEditingPack] = useState<Pack | null>(null);
  const [isPackDialogOpen, setIsPackDialogOpen] = useState(false);
  const [managingPackId, setManagingPackId] = useState<string | null>(null);
  const [displayedPacks, setDisplayedPacks] = useState<Pack[] | null>(null);
  const [animatingPackId, setAnimatingPackId] = useState<string | null>(null);

  const { data: packs, isLoading } = useQuery<Pack[]>({
    queryKey: ["/api/packs"],
  });

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

  const handleNewPack = () => {
    setEditingPack(null);
    setIsPackDialogOpen(true);
  };

  const handleManage = (packId: string) => {
    setAnimatingPackId(packId);
    setTimeout(() => {
      setManagingPackId(packId);
    }, 300);
  };

  const allPacks = packsToDisplay;

  if (managingPackId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="outline"
          onClick={() => {
            setAnimatingPackId(managingPackId);
            setTimeout(() => {
              setManagingPackId(null);
              setDisplayedPacks(null);
            }, 300);
          }}
          data-testid="button-back-to-packs"
        >
          Retour aux packs
        </Button>
        <FlashcardManager packId={managingPackId} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold">Tableau de bord Professeur</h1>
          <Button
            onClick={handleNewPack}
            className="gradient-violet-accent text-white border-0"
            data-testid="button-create-pack"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouveau pack
          </Button>
        </div>
        <p className="text-muted-foreground">Gérez vos packs et flashcards d'étude</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : allPacks.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">Aucun pack créé pour le moment</p>
            <Button onClick={handleNewPack} data-testid="button-create-first-pack">
              Créer votre premier pack
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {allPacks.map((pack) => (
            <Card
              key={pack.id}
              className={`overflow-hidden transition-all duration-300 ${
                animatingPackId === pack.id ? "scale-95 opacity-50" : ""
              }`}
              data-testid={`card-pack-${pack.id}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-xl" data-testid={`text-pack-title-${pack.id}`}>
                      {pack.title}
                    </CardTitle>
                    <CardDescription className="mt-2" data-testid={`text-pack-description-${pack.id}`}>
                      {pack.description}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={pack.published ? "default" : "secondary"}
                    data-testid={`badge-pack-status-${pack.id}`}
                  >
                    {pack.published ? "Publié" : "Brouillon"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleManage(pack.id)}
                    data-testid={`button-manage-pack-${pack.id}`}
                    className="gap-2"
                  >
                    <BookOpen className="h-4 w-4" />
                    Gérer les cartes
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(pack)}
                    data-testid={`button-edit-pack-${pack.id}`}
                    className="gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Modifier
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (confirm(`Êtes-vous sûr de vouloir supprimer "${pack.title}"?`)) {
                        deleteMutation.mutate(pack.id);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-pack-${pack.id}`}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Supprimer
                  </Button>
                </div>
                <div className="flex items-center gap-4 pt-4 border-t">
                  <span className="text-sm font-medium">Publier ce pack</span>
                  <Switch
                    checked={pack.published}
                    onCheckedChange={() => togglePublishMutation.mutate({ id: pack.id, published: !pack.published })}
                    disabled={togglePublishMutation.isPending}
                    data-testid={`switch-publish-pack-${pack.id}`}
                  />
                </div>
              </CardContent>
            </Card>
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
