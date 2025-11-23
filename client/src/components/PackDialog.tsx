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
      title: pack?.title || "",
      description: pack?.description || "",
      order: pack?.order || 0,
      published: pack?.published || false,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertPack) => apiRequest("POST", "/api/packs", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/packs"] });
      toast({
        title: "Pack created",
        description: "Your flashcard pack has been created successfully.",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create pack. Please try again.",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: InsertPack) =>
      apiRequest("PATCH", `/api/packs/${pack!.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/packs"] });
      toast({
        title: "Pack updated",
        description: "Your flashcard pack has been updated successfully.",
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update pack. Please try again.",
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
          <DialogTitle>{isEditing ? "Edit Pack" : "Create New Pack"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the details of your flashcard pack."
              : "Create a new flashcard pack to organize your study materials."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Spanish Vocabulary"
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
                      placeholder="Describe what this pack covers..."
                      rows={3}
                      data-testid="input-pack-description"
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
                      data-testid="input-pack-order"
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
              <Button type="submit" disabled={isPending} data-testid="button-save-pack">
                {isPending ? "Saving..." : isEditing ? "Update Pack" : "Create Pack"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
