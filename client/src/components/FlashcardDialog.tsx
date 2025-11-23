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
      question: flashcard?.question || "",
      answer: flashcard?.answer || "",
      order: flashcard?.order ?? nextOrder,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertFlashcard) =>
      apiRequest("POST", `/api/packs/${packId}/flashcards`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/packs", packId, "flashcards"] });
      toast({
        title: "Flashcard created",
        description: "Your flashcard has been created successfully.",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create flashcard.",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<InsertFlashcard>) =>
      apiRequest("PATCH", `/api/packs/${packId}/flashcards/${flashcard!.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/packs", packId, "flashcards"] });
      toast({
        title: "Flashcard updated",
        description: "Your flashcard has been updated successfully.",
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update flashcard.",
      });
    },
  });

  const onSubmit = (data: InsertFlashcard) => {
    if (isEditing) {
      const { packId: _, ...updateData } = data;
      updateMutation.mutate(updateData);
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Flashcard" : "Create New Flashcard"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the question and answer for this flashcard."
              : "Add a new flashcard to your pack."}
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
                  <FormLabel>Answer</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter the answer..."
                      rows={3}
                      data-testid="input-answer"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      data-testid="input-order"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
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
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} data-testid="button-save-flashcard">
                {isPending ? "Saving..." : isEditing ? "Update Flashcard" : "Create Flashcard"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
