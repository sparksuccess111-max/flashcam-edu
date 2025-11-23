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
import { insertPackSchema, type InsertPack, type Pack } from "@shared/schema";

interface PackDialogProps {
  pack: Pack | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PackDialog({ pack, open, onOpenChange }: PackDialogProps) {
  const { toast } = useToast();
  const isEditing = !!pack;

  const form = useForm<InsertPack>({
    resolver: zodResolver(insertPackSchema),
    defaultValues: {
      title: "",
      description: "",
      published: false,
    },
  });

  // Mettre à jour les valeurs du formulaire quand le pack ou le dialog s'ouvre
  useEffect(() => {
    if (open) {
      if (isEditing && pack) {
        form.reset({
          title: pack.title || "",
          description: pack.description || "",
          published: pack.published || false,
        });
      } else {
        form.reset({
          title: "",
          description: "",
          published: false,
        });
      }
    }
  }, [open, pack, isEditing, form]);

  const createMutation = useMutation({
    mutationFn: (data: InsertPack) => apiRequest("POST", "/api/packs", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/packs"] });
      toast({
        title: "Pack créé",
        description: "Votre pack de flashcard a été créé avec succès.",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de créer le pack. Veuillez réessayer.",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: InsertPack) =>
      apiRequest("PATCH", `/api/packs/${pack!.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/packs"] });
      toast({
        title: "Pack mis à jour",
        description: "Votre pack de flashcard a été mis à jour avec succès.",
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de mettre à jour le pack. Veuillez réessayer.",
      });
    },
  });

  const onSubmit = (data: InsertPack) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Modifier le paquet" : "Créer un nouveau paquet"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Mettez à jour les détails de votre paquet de cartes."
              : "Créez un nouveau paquet de cartes pour organiser vos matériaux d'étude."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titre</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Vocabulaire Espagnol"
                      data-testid="input-pack-title"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Décrivez ce que ce paquet couvre..."
                      rows={3}
                      data-testid="input-pack-description"
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
              <Button type="submit" className="gradient-violet-accent text-white border-0" disabled={isPending} data-testid="button-save-pack">
                {isPending ? "Enregistrement..." : isEditing ? "Modifier" : "Créer"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
