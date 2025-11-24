import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertFlashcardSchema, type InsertFlashcard, type Flashcard } from "@shared/schema";

interface FlashcardDialogProps {
  packId: string;
  flashcard: Flashcard | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nextOrder: number;
}

export function FlashcardDialog({ packId, flashcard, open, onOpenChange, nextOrder }: FlashcardDialogProps) {
  const { toast } = useToast();
  const isEditing = !!flashcard;

  const form = useForm<InsertFlashcard>({
    resolver: zodResolver(insertFlashcardSchema),
    defaultValues: {
      packId,
      question: "",
      answer: "",
    },
  });

  // Mettre à jour les valeurs du formulaire quand la flashcard ou le dialog s'ouvre
  useEffect(() => {
    if (open) {
      if (isEditing && flashcard) {
        form.reset({
          packId,
          question: flashcard.question || "",
          answer: flashcard.answer || "",
        });
      } else {
        form.reset({
          packId,
          question: "",
          answer: "",
        });
      }
    }
  }, [open, flashcard, isEditing, packId, form]);

  const createMutation = useMutation({
    mutationFn: (data: InsertFlashcard) =>
      apiRequest("POST", `/api/packs/${packId}/flashcards`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/packs", packId, "flashcards"] });
      toast({
        title: "Carte créée",
        description: "La carte a été créée avec succès.",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de créer la carte.",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<InsertFlashcard>) =>
      apiRequest("PATCH", `/api/packs/${packId}/flashcards/${flashcard!.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/packs", packId, "flashcards"] });
      toast({
        title: "Carte mise à jour",
        description: "La carte a été mise à jour avec succès.",
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de mettre à jour la carte.",
      });
    },
  });

  const onSubmit = (data: InsertFlashcard) => {
    if (isEditing) {
      const { packId: _, ...updateData } = data;
      updateMutation.mutate(updateData);
    } else {
      createMutation.mutate({ ...data, order: nextOrder });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Modifier la carte" : "Créer une nouvelle carte"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Mettez à jour la question et la réponse."
              : "Ajoutez une nouvelle carte à votre paquet."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="question"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter the question..."
                      rows={3}
                      data-testid="input-question"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="answer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Réponse</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Entrez la réponse..."
                      rows={3}
                      data-testid="input-answer"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel"
              >
                Annuler
              </Button>
              <Button type="submit" className="gradient-violet-accent text-white border-0" disabled={isPending} data-testid="button-save-flashcard">
                {isPending ? "Enregistrement..." : isEditing ? "Modifier" : "Créer"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
