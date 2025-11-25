import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, BookOpen, ChevronUp, ChevronDown, Check, X, Trash, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Pack, AccountRequest, User } from "@shared/schema";
import { PackDialog } from "@/components/PackDialog";
import { FlashcardManager } from "@/components/FlashcardManager";

export default function AdminDashboard() {
  const { toast } = useToast();
  const [editingPack, setEditingPack] = useState<Pack | null>(null);
  const [isPackDialogOpen, setIsPackDialogOpen] = useState(false);
  const [managingPackId, setManagingPackId] = useState<string | null>(null);
  const [displayedPacks, setDisplayedPacks] = useState<Pack[] | null>(null);
  const [animatingPackId, setAnimatingPackId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("packs");
  const [selectedRoles, setSelectedRoles] = useState<{ [key: string]: "admin" | "student" }>({});
  const [selectedSubjects, setSelectedSubjects] = useState<{ [key: string]: string }>({});

  const { data: packs, isLoading } = useQuery<Pack[]>({
    queryKey: ["/api/packs"],
  });

  const { data: accountRequests, isLoading: requestsLoading } = useQuery<AccountRequest[]>({
    queryKey: ["/api/admin/requests"],
  });

  const { data: allUsers, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: deletedPacks, isLoading: deletedLoading } = useQuery<Pack[]>({
    queryKey: ["/api/packs/deleted/all"],
  });

  // Sync displayed packs with server data
  const packsToDisplay = displayedPacks !== null ? displayedPacks : (packs || []);

  const deleteMutation = useMutation({
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
        description: "Impossible de supprimer le pack. Veuillez réessayer.",
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

  const approveMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: "admin" | "student" }) => 
      apiRequest("POST", `/api/admin/requests/${id}/approve`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Compte approuvé",
        description: "Le compte a été approuvé avec succès.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'approuver le compte.",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/admin/requests/${id}/reject`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/requests"] });
      toast({
        title: "Demande refusée",
        description: "La demande a été refusée.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de refuser la demande.",
      });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: "admin" | "student" }) =>
      apiRequest("PATCH", `/api/admin/users/${userId}/role`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Rôle mis à jour",
        description: "Le rôle de l'utilisateur a été mis à jour avec succès.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de mettre à jour le rôle de l'utilisateur.",
      });
    },
  });

  const updateSubjectMutation = useMutation({
    mutationFn: ({ userId, subject }: { userId: string; subject: string }) =>
      apiRequest("PATCH", `/api/admin/users/${userId}/subject`, { subject }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Matière mise à jour",
        description: "La matière a été mise à jour avec succès.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de mettre à jour la matière.",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => apiRequest("DELETE", `/api/admin/users/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Utilisateur supprimé",
        description: "L'utilisateur a été supprimé avec succès.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de supprimer l'utilisateur.",
      });
    },
  });

  const allPacks = packsToDisplay;

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
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400 bg-clip-text text-transparent">Tableau de bord</h1>
        <p className="text-muted-foreground">
          Gérez vos packs de flashcard et les demandes de comptes
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="packs">Packs</TabsTrigger>
          <TabsTrigger value="deleted">Supprimés {deletedPacks && deletedPacks.length > 0 && <Badge variant="destructive" className="ml-2 text-xs">{deletedPacks.length}</Badge>}</TabsTrigger>
          <TabsTrigger value="requests">
            Demandes
            {accountRequests && accountRequests.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                {accountRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="admins">Comptes</TabsTrigger>
        </TabsList>

        <TabsContent value="packs" className="space-y-4">
          <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
            <div>
              <h2 className="text-xl font-semibold">Vos packs</h2>
            </div>
            <Button className="gradient-violet-accent text-white border-0" onClick={handleCreate} data-testid="button-create-pack">
              <Plus className="h-4 w-4 mr-2" />
              Créer un pack
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : allPacks.length === 0 ? (
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
                  <Card 
                    data-testid={`card-pack-${pack.id}`} 
                    className="hover:shadow-md transition-all duration-300 cursor-pointer"
                    onClick={() => setManagingPackId(pack.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="space-y-2">
                        <CardTitle className="break-words" data-testid={`text-pack-title-${pack.id}`}>
                          {pack.title}
                        </CardTitle>
                        <CardDescription className="break-words" data-testid={`text-pack-description-${pack.id}`}>
                          {pack.description || "Pas de description"}
                        </CardDescription>
                        <div className="flex items-center justify-between pt-2">
                          <Badge variant={pack.published ? "default" : "secondary"} data-testid={`badge-status-${pack.id}`}>
                            {pack.published ? "Publié" : "Brouillon"}
                          </Badge>
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <span className="text-xs text-muted-foreground hidden sm:inline">Publier</span>
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
                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveUp(pack.id);
                            }}
                            disabled={idx === 0}
                            data-testid={`button-move-up-${pack.id}`}
                          >
                            <ChevronUp className="h-4 w-4" />
                            <span className="hidden sm:inline ml-2">Monter</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveDown(pack.id);
                            }}
                            disabled={idx === allPacks.length - 1}
                            data-testid={`button-move-down-${pack.id}`}
                          >
                            <ChevronDown className="h-4 w-4" />
                            <span className="hidden sm:inline ml-2">Descendre</span>
                          </Button>
                        </div>
                        <div className="flex gap-2 flex-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(pack);
                            }}
                            data-testid={`button-edit-${pack.id}`}
                            className="flex-1"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            <span>Modifier</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(pack.id);
                            }}
                            disabled={deleteMutation.isPending}
                            data-testid={`button-delete-${pack.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="deleted" className="space-y-4">
          <div className="mb-8">
            <h2 className="text-xl font-semibold">Packs supprimés</h2>
          </div>

          {deletedLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : !deletedPacks || deletedPacks.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent className="space-y-4">
                <div className="flex justify-center">
                  <div className="bg-muted p-4 rounded-full">
                    <Trash2 className="h-12 w-12 text-muted-foreground" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Aucun pack supprimé</h3>
                  <p className="text-muted-foreground">
                    Les packs supprimés apparaîtront ici
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {deletedPacks.map((pack) => (
                <Card key={pack.id} data-testid={`card-deleted-pack-${pack.id}`} className="border-destructive/30">
                  <CardHeader className="pb-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="break-words">{pack.title}</CardTitle>
                        <Badge variant="destructive">Supprimé</Badge>
                      </div>
                      <CardDescription className="break-words">
                        {pack.description || "Pas de description"}
                      </CardDescription>
                      <div className="flex items-center gap-2 pt-2">
                        <Badge variant="outline">{pack.subject}</Badge>
                        {pack.createdByUserId && <span className="text-xs text-muted-foreground">Creator ID: {pack.createdByUserId.slice(0, 8)}...</span>}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => restorePackMutation.mutate(pack.id)}
                        disabled={restorePackMutation.isPending}
                        data-testid={`button-restore-pack-${pack.id}`}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Restaurer
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (confirm("Êtes-vous sûr de vouloir supprimer ce pack définitivement? Cette action est irréversible.")) {
                            permanentlyDeleteMutation.mutate(pack.id);
                          }
                        }}
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

        <TabsContent value="requests" className="space-y-4">
          <div className="mb-8">
            <h2 className="text-xl font-semibold">Demandes d'inscription en attente</h2>
          </div>

          {requestsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : !accountRequests || accountRequests.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <p className="text-muted-foreground">Aucune demande en attente</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {accountRequests.map((request) => (
                <Card key={request.id} data-testid={`card-request-${request.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div>
                        <CardTitle className="text-lg" data-testid={`text-request-name-${request.id}`}>
                          {request.firstName} {request.lastName}
                        </CardTitle>
                        <CardDescription>
                          Statut: <Badge variant="secondary">{request.status}</Badge>
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex gap-2 items-center">
                          <Select 
                            value={selectedRoles[request.id] || "student"} 
                            onValueChange={(value) => setSelectedRoles({...selectedRoles, [request.id]: value as "admin" | "teacher" | "student"})}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="student">Étudiant</SelectItem>
                              <SelectItem value="teacher">Professeur</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => approveMutation.mutate({id: request.id, role: selectedRoles[request.id] || "student"})}
                            disabled={approveMutation.isPending}
                            data-testid={`button-approve-${request.id}`}
                            className="gap-2"
                          >
                            <Check className="h-4 w-4" />
                            Approuver
                          </Button>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => rejectMutation.mutate(request.id)}
                          disabled={rejectMutation.isPending}
                          data-testid={`button-reject-${request.id}`}
                          className="gap-2"
                        >
                          <X className="h-4 w-4" />
                          Refuser
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="admins" className="space-y-4">
          <div className="mb-8">
            <h2 className="text-xl font-semibold">Gestion des comptes</h2>
          </div>

          {usersLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : !allUsers || allUsers.filter(user => !(user.firstName === "Camille" && user.lastName === "Cordier")).length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <p className="text-muted-foreground">Aucun compte pour l'instant</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {allUsers.filter(user => !(user.firstName === "Camille" && user.lastName === "Cordier")).map((user) => (
                <Card key={user.id} data-testid={`card-user-${user.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex-1">
                        <CardTitle className="text-lg" data-testid={`text-user-name-${user.id}`}>
                          {user.firstName} {user.lastName}
                        </CardTitle>
                        <CardDescription>
                          Rôle: <Badge variant={user.role === "admin" ? "default" : user.role === "teacher" ? "secondary" : "outline"}>{user.role === "admin" ? "Administrateur" : user.role === "teacher" ? "Professeur" : "Étudiant"}</Badge>
                          {user.role === "teacher" && user.subject && <Badge className="ml-2">{user.subject}</Badge>}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2 items-center flex-wrap">
                        <Select 
                          value={user.role} 
                          onValueChange={(value) => {
                            updateRoleMutation.mutate({userId: user.id, role: value as "admin" | "teacher" | "student"});
                          }}
                          disabled={updateRoleMutation.isPending}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="student">Étudiant</SelectItem>
                            <SelectItem value="teacher">Professeur</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        {user.role === "teacher" && (
                          <Select 
                            value={user.subject || ""} 
                            onValueChange={(value) => {
                              updateSubjectMutation.mutate({userId: user.id, subject: value});
                            }}
                            disabled={updateSubjectMutation.isPending}
                          >
                            <SelectTrigger className="w-48">
                              <SelectValue placeholder="Choisir une matière..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Histoire-Géo">Histoire-Géo</SelectItem>
                              <SelectItem value="Maths">Maths</SelectItem>
                              <SelectItem value="Français">Français</SelectItem>
                              <SelectItem value="SVT">SVT</SelectItem>
                              <SelectItem value="Anglais">Anglais</SelectItem>
                              <SelectItem value="Physique-Chimie">Physique-Chimie</SelectItem>
                              <SelectItem value="Technologie">Technologie</SelectItem>
                              <SelectItem value="Éducation Physique">Éducation Physique</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (confirm(`Êtes-vous sûr de vouloir supprimer ${user.firstName} ${user.lastName}?`)) {
                              deleteUserMutation.mutate(user.id);
                            }
                          }}
                          disabled={deleteUserMutation.isPending}
                          data-testid={`button-delete-user-${user.id}`}
                          className="gap-2"
                        >
                          <Trash className="h-4 w-4" />
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
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
