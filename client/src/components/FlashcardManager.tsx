import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Plus, Edit, Trash2, Upload, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Pack, Flashcard } from "@shared/schema";
import { FlashcardDialog } from "./FlashcardDialog";
import { BulkImportDialog } from "./BulkImportDialog";

interface FlashcardManagerProps {
  packId: string;
  onClose: () => void;
}

export function FlashcardManager({ packId, onClose }: FlashcardManagerProps) {
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

  const deleteMutation = useMutation({
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

  const handleEdit = (card: Flashcard) => {
    setEditingCard(card);
    setIsCardDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingCard(null);
    setIsCardDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette carte?")) {
      deleteMutation.mutate(id);
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
      const response = await fetch(`/api/packs/${packId}/export`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Accept": "text/plain",
        },
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
      <Button
        variant="ghost"
        onClick={onClose}
        className="mb-6"
        data-testid="button-back-to-dashboard"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour au tableau de bord
      </Button>

      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400 bg-clip-text text-transparent" data-testid="text-pack-title">
            {pack?.title || "Gérer les cartes"}
          </h1>
          <p className="text-muted-foreground">
            Ajouter, modifier ou supprimer des cartes
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={cards.length === 0}
            data-testid="button-export-flashcards"
          >
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button variant="outline" onClick={() => setIsBulkImportOpen(true)} data-testid="button-bulk-import">
            <Upload className="h-4 w-4 mr-2" />
            Importer
          </Button>
          <Button className="gradient-violet-accent text-white border-0" onClick={handleCreate} data-testid="button-create-flashcard">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
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
          {cards.map((card: Flashcard) => (
            <Card key={card.id} data-testid={`card-flashcard-${card.id}`}>
              <CardHeader>
                <CardTitle className="text-lg" data-testid={`text-question-${card.id}`}>
                  {card.question}
                </CardTitle>
                <CardDescription data-testid={`text-answer-${card.id}`}>
                  {card.answer}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(card)}
                    data-testid={`button-edit-${card.id}`}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(card.id)}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-${card.id}`}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
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
