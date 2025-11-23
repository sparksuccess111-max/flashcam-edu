import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Plus, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Pack, Flashcard } from "@shared/schema";
import { FlashcardDialog } from "./FlashcardDialog";

interface FlashcardManagerProps {
  packId: string;
  onClose: () => void;
}

export function FlashcardManager({ packId, onClose }: FlashcardManagerProps) {
  const { toast } = useToast();
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [isCardDialogOpen, setIsCardDialogOpen] = useState(false);

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
    if (confirm("Are you sure you want to delete this flashcard?")) {
      deleteMutation.mutate(id);
    }
  };

  const sortedCards = flashcards?.sort((a, b) => a.order - b.order) || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="ghost"
        onClick={onClose}
        className="mb-6"
        data-testid="button-back-to-dashboard"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Dashboard
      </Button>

      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold mb-2" data-testid="text-pack-title">
            {pack?.title || "Manage Flashcards"}
          </h1>
          <p className="text-muted-foreground">
            Add, edit, or remove flashcards from this pack
          </p>
        </div>
        <Button onClick={handleCreate} data-testid="button-create-flashcard">
          <Plus className="h-4 w-4 mr-2" />
          Add Flashcard
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : sortedCards.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold mb-2">No Flashcards Yet</h3>
              <p className="text-muted-foreground mb-4">
                Start adding flashcards to this pack
              </p>
              <Button onClick={handleCreate} data-testid="button-create-first-flashcard">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Flashcard
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedCards.map((card) => (
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
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(card.id)}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-${card.id}`}
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

      <FlashcardDialog
        packId={packId}
        flashcard={editingCard}
        open={isCardDialogOpen}
        onOpenChange={setIsCardDialogOpen}
        nextOrder={sortedCards.length}
      />
    </div>
  );
}
