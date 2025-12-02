import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface BulkImportDialogProps {
  packId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BulkImportDialog({ packId, open, onOpenChange }: BulkImportDialogProps) {
  const { toast } = useToast();
  const [text, setText] = useState("");

  const importMutation = useMutation({
    mutationFn: async (content: string) => {
      const lines = content.split("\n").filter(line => line.trim());
      const flashcards: Array<{ front: string; back: string }> = [];

      for (const line of lines) {
        const match = line.match(/\("(.+?)",\s*"(.+?)"\)/);
        if (match) {
          flashcards.push({
            front: match[1],
            back: match[2],
          });
        }
      }

      if (flashcards.length === 0) {
        throw new Error("Aucune carte trouvée. Vérifiez le format.");
      }

      await Promise.all(
        flashcards.map((card) =>
          apiRequest("POST", `/api/packs/${packId}/flashcards`, card)
        )
      );

      return flashcards.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["/api/packs", packId, "flashcards"] });
      toast({
        title: "Cartes importées",
        description: `${count} carte(s) ont été ajoutées avec succès.`,
      });
      onOpenChange(false);
      setText("");
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible d'importer les cartes.",
      });
    },
  });

  const handleImport = () => {
    if (!text.trim()) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez coller du contenu à importer.",
      });
      return;
    }
    importMutation.mutate(text);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importer plusieurs cartes</DialogTitle>
          <DialogDescription>
            Collez vos cartes au format: ("Question", "Réponse")<br/>
            Une paire par ligne.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            placeholder={`("Comment...?", "Réponse...")\n("Comment...?", "Réponse...")`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-48 font-mono text-sm"
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button
              className="gradient-violet-accent text-white border-0"
              onClick={handleImport}
              disabled={importMutation.isPending}
            >
              {importMutation.isPending ? "Import..." : "Importer"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
