import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, BookOpen } from "lucide-react";
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

  const { data: packs, isLoading } = useQuery<Pack[]>({
    queryKey: ["/api/packs"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/packs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/packs"] });
      toast({
        title: "Pack deleted",
        description: "The flashcard pack has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete pack. Please try again.",
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
        title: "Error",
        description: "Failed to update pack status.",
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
    if (confirm("Are you sure you want to delete this pack? This will also delete all its flashcards.")) {
      deleteMutation.mutate(id);
    }
  };

  const handleTogglePublish = (pack: Pack) => {
    togglePublishMutation.mutate({ id: pack.id, published: !pack.published });
  };

  const allPacks = packs || [];

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
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your flashcard packs and content
          </p>
        </div>
        <Button onClick={handleCreate} data-testid="button-create-pack">
          <Plus className="h-4 w-4 mr-2" />
          Create Pack
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
              <h3 className="text-xl font-semibold mb-2">No Packs Yet</h3>
              <p className="text-muted-foreground mb-4">
                Get started by creating your first flashcard pack
              </p>
              <Button onClick={handleCreate} data-testid="button-create-first-pack">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Pack
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {allPacks.map((pack) => (
            <Card key={pack.id} data-testid={`card-pack-${pack.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="break-words" data-testid={`text-pack-title-${pack.id}`}>
                        {pack.title}
                      </CardTitle>
                      <Badge variant={pack.published ? "default" : "secondary"} data-testid={`badge-status-${pack.id}`}>
                        {pack.published ? "Published" : "Draft"}
                      </Badge>
                    </div>
                    <CardDescription className="break-words" data-testid={`text-pack-description-${pack.id}`}>
                      {pack.description || "No description"}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Published</span>
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
                    Manage Flashcards
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(pack)}
                    data-testid={`button-edit-${pack.id}`}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(pack.id)}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-${pack.id}`}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
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
