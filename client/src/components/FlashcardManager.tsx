import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Edit, Trash2, Upload, Download, ChevronUp, ChevronDown, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Pack, Flashcard } from "@shared/schema";
import { FlashcardDialog } from "./FlashcardDialog";
import { BulkImportDialog } from "./BulkImportDialog";

interface FlashcardManagerProps {
  packId: string;
  onClose: () => void;
  onEditPack?: (pack: Pack) => void;
}

export function FlashcardManager({ packId, onClose, onEditPack }: FlashcardManagerProps) {
  const { toast } = useToast();
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [isCardDialogOpen, setIsCardDialogOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: pack } = useQuery<Pack>({
    queryKey: ["/api/packs", packId],
  });

  const { data: flashcards, isLoading } = useQuery<Flashcard[]>({
    queryKey: ["/api/packs", packId, "flashcards"],
  });

  const reorderMutation = useMutation({
    mutationFn: ({ id, direction }: { id: string; direction: "up" | "down" }) =>
      apiRequest("PATCH", `/api/packs/${packId}/flashcards/${id}/reorder`, { direction }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/packs", packId, "flashcards"] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reorder flashcard.",
      });
    },
  });

  const deleteCardMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("DELETE", `/api/packs/${packId}/flashcards/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/packs", packId, "flashcards"] });
      toast({
        title: "Flashcard deleted",
        description: "The flashcard has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete flashcard.",
      });
    },
  });

  const deletePackMutation = useMutation({
    mutationFn: () =>
      apiRequest("DELETE", `/api/packs/${packId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/packs"] });
      toast({
        title: "Pack supprimé",
        description: "Le pack a été supprimé avec succès.",
      });
      onClose();
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de supprimer le pack.",
      });
    },
  });

  const handleEdit = (card: Flashcard) => {
    setEditingCard(card);
    setIsCardDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingCard(null);
    setIsCardDialogOpen(true);
  };

  const handleDeleteCard = (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette carte?")) {
      deleteCardMutation.mutate(id);
    }
  };

  const handleDeletePack = () => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce pack? Cette action est irréversible.")) {
      deletePackMutation.mutate();
    }
  };

  const handleExport = async () => {
    if (!pack || !flashcards || flashcards.length === 0) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Aucune carte à exporter",
      });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {
        "Accept": "text/plain",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/packs/${packId}/export`, {
        method: "GET",
        headers,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Export failed");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${pack.title}-flashcards.txt`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast({
        title: "Succès",
        description: `${flashcards.length} flashcard${flashcards.length > 1 ? "s" : ""} exportée${flashcards.length > 1 ? "s" : ""}!`,
      });
    } catch (error: any) {
      console.error("Export error:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible d'exporter les flashcards",
      });
    }
  };

  const cards = flashcards || [];

  return (
    <div className="container mx-auto px-4 py-8">

      <div className="flex items-center justify-between mb-8 gap-2 md:gap-4 flex-wrap">
        <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
          <Button
            variant="outline"
            onClick={onClose}
            data-testid="button-back-to-dashboard"
            className="gap-1 md:gap-2 flex-shrink-0"
            size="sm"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Retour</span>
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl md:text-3xl font-bold mb-1 bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400 bg-clip-text text-transparent truncate" data-testid="text-pack-title">
              {pack?.title || "Gérer les cartes"}
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">
              Ajouter, modifier ou supprimer des cartes
            </p>
          </div>
        </div>
        <div className="flex gap-1 md:gap-2 flex-wrap justify-end">
          {onEditPack && (
            <Button
              variant="outline"
              onClick={() => pack && onEditPack(pack)}
              className="gap-1 md:gap-2"
              size="sm"
              data-testid="button-edit-pack-info"
            >
              <Edit className="h-4 w-4" />
              <span className="hidden sm:inline">Modifier</span>
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={cards.length === 0}
            size="sm"
            data-testid="button-export-flashcards"
          >
            <Download className="h-4 w-4 md:mr-1" />
            <span className="hidden sm:inline">Exporter</span>
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setIsBulkImportOpen(true)} 
            size="sm"
            data-testid="button-bulk-import"
          >
            <Upload className="h-4 w-4 md:mr-1" />
            <span className="hidden sm:inline">Importer</span>
          </Button>
          <Button 
            className="gradient-violet-accent text-white border-0" 
            onClick={handleCreate} 
            size="sm"
            data-testid="button-create-flashcard"
          >
            <Plus className="h-4 w-4 md:mr-1" />
            <span className="hidden sm:inline">Ajouter</span>
          </Button>
          <Button
            variant="outline"
            onClick={handleDeletePack}
            disabled={deletePackMutation.isPending}
            data-testid="button-delete-pack"
            size="sm"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : cards.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold mb-2">Aucune carte pour le moment</h3>
              <p className="text-muted-foreground mb-4">
                Commencez par ajouter des cartes à ce paquet
              </p>
              <Button className="gradient-violet-accent text-white border-0" onClick={handleCreate} data-testid="button-create-first-flashcard">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter votre première carte
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {cards.map((card: Flashcard, idx: number) => (
            <Card 
              key={card.id} 
              data-testid={`card-flashcard-${card.id}`}
              className="cursor-pointer hover-elevate"
              onClick={() => handleEdit(card)}
            >
              <CardHeader>
                <CardTitle className="text-lg" data-testid={`text-question-${card.id}`}>
                  {card.front}
                </CardTitle>
                <CardDescription data-testid={`text-answer-${card.id}`}>
                  {card.back}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      reorderMutation.mutate({ id: card.id, direction: "up" });
                    }}
                    disabled={idx === 0 || reorderMutation.isPending}
                    data-testid={`button-move-up-${card.id}`}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      reorderMutation.mutate({ id: card.id, direction: "down" });
                    }}
                    disabled={idx === cards.length - 1 || reorderMutation.isPending}
                    data-testid={`button-move-down-${card.id}`}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCard(card.id);
                    }}
                    disabled={deleteCardMutation.isPending}
                    data-testid={`button-delete-${card.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <FlashcardDialog
        packId={packId}
        flashcard={editingCard}
        open={isCardDialogOpen}
        onOpenChange={setIsCardDialogOpen}
        nextOrder={cards.length}
      />
      <BulkImportDialog
        packId={packId}
        open={isBulkImportOpen}
        onOpenChange={setIsBulkImportOpen}
      />
    </div>
  );
}
