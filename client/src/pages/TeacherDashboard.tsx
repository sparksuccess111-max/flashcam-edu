import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, BookOpen, RotateCcw, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth-context";
import type { Pack } from "@shared/schema";
import { PackDialog } from "@/components/PackDialog";
import { FlashcardManager } from "@/components/FlashcardManager";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [editingPack, setEditingPack] = useState<Pack | null>(null);
  const [isPackDialogOpen, setIsPackDialogOpen] = useState(false);
  const [managingPackId, setManagingPackId] = useState<string | null>(null);
  const [displayedPacks, setDisplayedPacks] = useState<Pack[] | null>(null);
  const [animatingPackId, setAnimatingPackId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("active");

  const { data: packs, isLoading } = useQuery<Pack[]>({
    queryKey: ["/api/packs"],
  });

  const { data: deletedPacks, isLoading: deletedLoading } = useQuery<Pack[]>({
    queryKey: ["/api/packs/deleted/all"],
  });

  // Filter packs to show only those matching the teacher's assigned subject
  const filteredPacks = packs?.filter(pack => pack.subject === user?.subject) || [];
  const packsToDisplay = displayedPacks !== null ? displayedPacks : filteredPacks;


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

  const deletePackMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/packs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/packs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/packs/deleted/all"] });
      toast({
        title: "Pack supprimé",
        description: "Le pack a été supprimé avec succès.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de supprimer le pack.",
      });
    },
  });

  const restorePackMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/packs/${id}/restore`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/packs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/packs/deleted/all"] });
      toast({
        title: "Pack restauré",
        description: "Le pack a été restauré avec succès.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de restaurer le pack.",
      });
    },
  });

  const permanentlyDeleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/packs/${id}/permanent`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/packs/deleted/all"] });
      toast({
        title: "Pack supprimé définitivement",
        description: "Le pack a été supprimé de manière définitive.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de supprimer le pack.",
      });
    },
  });

  const handleEdit = (pack: Pack) => {
    setEditingPack(pack);
    setIsPackDialogOpen(true);
  };

  const handleDeletePack = (packId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce pack?")) {
      deletePackMutation.mutate(packId);
    }
  };

  const handleRestorePack = (packId: string) => {
    restorePackMutation.mutate(packId);
  };

  const handlePermanentlyDelete = (packId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce pack définitivement? Cette action est irréversible.")) {
      permanentlyDeleteMutation.mutate(packId);
    }
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
              setAnimatingPackId(null);
            }, 300);
          }}
          data-testid="button-back-to-packs"
        >
          Retour aux packs
        </Button>
        <FlashcardManager packId={managingPackId} onEditPack={handleEdit} onClose={() => {
            setAnimatingPackId(managingPackId);
            setTimeout(() => {
              setManagingPackId(null);
              setDisplayedPacks(null);
              setAnimatingPackId(null);
            }, 300);
          }} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold">Tableau de bord Professeur</h1>
            {user?.subject && (
              <p className="text-sm text-muted-foreground mt-1">
                Matière assignée: <Badge className="ml-2">{user.subject}</Badge>
              </p>
            )}
          </div>
          <Button
            onClick={handleNewPack}
            className="gradient-violet-accent text-white border-0"
            data-testid="button-create-pack"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouveau pack
          </Button>
        </div>
        <p className="text-muted-foreground">Vous voyez uniquement les packs de votre matière</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active">Packs actifs</TabsTrigger>
          <TabsTrigger value="deleted">Packs supprimés {deletedPacks && deletedPacks.length > 0 && <Badge variant="destructive" className="ml-2">{deletedPacks.length}</Badge>}</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
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
                  className={`overflow-hidden transition-all duration-300 cursor-pointer hover-elevate ${
                    animatingPackId === pack.id ? "scale-95 opacity-50" : ""
                  }`}
                  data-testid={`card-pack-${pack.id}`}
                  onClick={() => handleManage(pack.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-xl" data-testid={`text-pack-title-${pack.id}`}>
                            {pack.title}
                          </CardTitle>
                          <Badge variant="outline" data-testid={`badge-pack-subject-${pack.id}`}>
                            {pack.subject}
                          </Badge>
                        </div>
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
                        onClick={(e) => {
                          e.stopPropagation();
                          handleManage(pack.id);
                        }}
                        data-testid={`button-manage-pack-${pack.id}`}
                        className="gap-2"
                      >
                        <BookOpen className="h-4 w-4" />
                        Gestion des cartes
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(pack);
                        }}
                        data-testid={`button-edit-pack-${pack.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePack(pack.id);
                        }}
                        disabled={deletePackMutation.isPending}
                        data-testid={`button-delete-pack-${pack.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-4 pt-4 border-t">
                      <span className="text-sm font-medium">Publier ce pack</span>
                      <div onClick={(e) => e.stopPropagation()}>
                        <Switch
                          checked={pack.published}
                          onCheckedChange={(checked) => {
                            togglePublishMutation.mutate({ id: pack.id, published: checked });
                          }}
                          disabled={togglePublishMutation.isPending}
                          data-testid={`switch-publish-pack-${pack.id}`}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="deleted" className="space-y-4">
          {deletedLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : !deletedPacks || deletedPacks.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Trash2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">Aucun pack supprimé</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {deletedPacks.map((pack) => (
                <Card key={pack.id} data-testid={`card-deleted-pack-${pack.id}`} className="border-destructive/30">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-xl">{pack.title}</CardTitle>
                          <Badge variant="destructive">Supprimé</Badge>
                        </div>
                        <CardDescription className="mt-2">{pack.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRestorePack(pack.id)}
                        disabled={restorePackMutation.isPending}
                        data-testid={`button-restore-pack-${pack.id}`}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Restaurer
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handlePermanentlyDelete(pack.id)}
                        disabled={permanentlyDeleteMutation.isPending}
                        data-testid={`button-permanent-delete-pack-${pack.id}`}
                      >
                        <Trash className="h-4 w-4 mr-2" />
                        Supprimer définitivement
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <PackDialog
        pack={editingPack}
        open={isPackDialogOpen}
        onOpenChange={setIsPackDialogOpen}
      />
    </div>
  );
}
