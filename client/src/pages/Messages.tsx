import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertMessageSchema } from "@shared/schema";
import type { User, Message } from "@shared/schema";
import { Send, MessageSquare } from "lucide-react";
import { z } from "zod";

const sendMessageSchema = insertMessageSchema.extend({
  toUserId: z.string().min(1, "Recipient is required"),
});

export default function Messages() {
  const { toast } = useToast();
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  const { data: recipients } = useQuery<User[]>({
    queryKey: ["/api/messages/recipients"],
  });

  const { data: messages } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
  });

  const form = useForm({
    resolver: zodResolver(sendMessageSchema),
    defaultValues: {
      toUserId: "",
      content: "",
      fromUserId: "",
    },
  });

  const sendMutation = useMutation({
    mutationFn: (data: z.infer<typeof sendMessageSchema>) =>
      apiRequest("POST", "/api/messages", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      form.reset();
      toast({
        title: "Message envoyé",
        description: "Votre message a été envoyé avec succès.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'envoyer le message. Veuillez réessayer.",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof sendMessageSchema>) => {
    if (!data.toUserId) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez sélectionner un destinataire.",
      });
      return;
    }
    sendMutation.mutate(data);
  };

  const selectedUser = recipients?.find(u => u.id === selectedUserId);
  const userMessages = messages?.filter(
    m => (m.fromUserId === selectedUserId || m.toUserId === selectedUserId)
  ) || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Messages</h1>
        <p className="text-muted-foreground">Communiquez avec vos collègues et administrateurs</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recipients List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Contacts</CardTitle>
              <CardDescription>Sélectionnez un destinataire</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {!recipients || recipients.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucun contact disponible</p>
                ) : (
                  recipients.map(user => (
                    <button
                      key={user.id}
                      onClick={() => {
                        setSelectedUserId(user.id);
                        form.setValue("toUserId", user.id);
                      }}
                      className={`w-full text-left p-3 rounded-md transition-colors ${
                        selectedUserId === user.id
                          ? "bg-violet-100 dark:bg-violet-900"
                          : "hover:bg-muted"
                      }`}
                      data-testid={`button-select-user-${user.id}`}
                    >
                      <div className="font-medium text-sm">{user.firstName} {user.lastName}</div>
                      <div className="text-xs text-muted-foreground">
                        {user.role === "admin" ? "Administrateur" : user.role === "teacher" ? "Professeur" : "Étudiant"}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Messages & Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Message History */}
          {selectedUser && (
            <Card>
              <CardHeader>
                <CardTitle>{selectedUser.firstName} {selectedUser.lastName}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 max-h-96 overflow-y-auto">
                {userMessages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Aucun message pour le moment</p>
                  </div>
                ) : (
                  userMessages.map(msg => (
                    <div
                      key={msg.id}
                      className="p-3 rounded-lg bg-muted"
                      data-testid={`message-${msg.id}`}
                    >
                      <div className="text-xs text-muted-foreground mb-1">
                        {new Date(msg.createdAt).toLocaleString()}
                      </div>
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )}

          {/* Send Message Form */}
          {selectedUser ? (
            <Card>
              <CardHeader>
                <CardTitle>Envoyer un message</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Message</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Écrivez votre message..."
                              className="resize-none"
                              data-testid="input-message-content"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      disabled={sendMutation.isPending}
                      className="w-full"
                      data-testid="button-send-message"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Envoyer
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Sélectionnez un contact pour commencer</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
