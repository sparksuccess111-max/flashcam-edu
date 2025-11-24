import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertMessageSchema } from "@shared/schema";
import type { User, Message } from "@shared/schema";
import { Send, MessageSquare, Search } from "lucide-react";
import { z } from "zod";

const sendMessageSchema = insertMessageSchema.extend({
  toUserId: z.string().min(1, "Recipient is required"),
});

export default function Messages() {
  const { toast } = useToast();
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const { data: recipients = [] } = useQuery<User[]>({
    queryKey: ["/api/messages/recipients"],
  });

  const { data: messages = [] } = useQuery<Message[]>({
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
      form.reset({ toUserId: selectedUserId, content: "", fromUserId: "" });
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

  const selectedUser = recipients.find(u => u.id === selectedUserId);
  const userMessages = messages.filter(
    m => (m.fromUserId === selectedUserId || m.toUserId === selectedUserId)
  ) || [];

  const filteredRecipients = recipients.filter(user =>
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleLabel = (role: string) => {
    return role === "admin" ? "Administrateur" : role === "teacher" ? "Professeur" : "Étudiant";
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Messages</h1>
        <p className="text-muted-foreground">Communiquez avec vos collègues et administrateurs</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recipients List */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="text-lg">Contacts</CardTitle>
              <CardDescription>Sélectionnez un destinataire</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Chercher un contact..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                  data-testid="input-search-recipients"
                />
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredRecipients.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {recipients.length === 0 ? "Aucun contact disponible" : "Aucun contact ne correspond"}
                  </p>
                ) : (
                  filteredRecipients.map(user => (
                    <button
                      key={user.id}
                      onClick={() => {
                        setSelectedUserId(user.id);
                        form.setValue("toUserId", user.id);
                      }}
                      className={`w-full text-left p-3 rounded-md transition-colors border ${
                        selectedUserId === user.id
                          ? "bg-violet-100 dark:bg-violet-900 border-violet-300 dark:border-violet-700"
                          : "border-transparent hover:bg-muted"
                      }`}
                      data-testid={`button-select-user-${user.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{user.firstName} {user.lastName}</div>
                          <div className="text-xs text-muted-foreground">{getRoleLabel(user.role)}</div>
                        </div>
                        <Badge variant="secondary" className="ml-2 flex-shrink-0 text-xs">
                          {user.role === "admin" ? "Admin" : user.role === "teacher" ? "Prof" : "Stud"}
                        </Badge>
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
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{selectedUser.firstName} {selectedUser.lastName}</CardTitle>
                    <CardDescription>{getRoleLabel(selectedUser.role)}</CardDescription>
                  </div>
                  <Badge variant="default">{getRoleLabel(selectedUser.role)}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 max-h-96 overflow-y-auto p-4">
                {userMessages.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="h-12 w-12 mx-auto mb-2 text-muted-foreground opacity-50" />
                    <p className="text-sm text-muted-foreground">Aucun message pour le moment</p>
                    <p className="text-xs text-muted-foreground mt-1">Envoyez un message pour commencer la conversation</p>
                  </div>
                ) : (
                  userMessages.map(msg => (
                    <div
                      key={msg.id}
                      className="p-3 rounded-lg bg-muted"
                      data-testid={`message-${msg.id}`}
                    >
                      <div className="text-xs text-muted-foreground mb-1 flex justify-between">
                        <span>{new Date(msg.createdAt).toLocaleString()}</span>
                        {msg.read && <span className="text-green-600 dark:text-green-400">✓</span>}
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
                <CardTitle>Envoyer un message à {selectedUser.firstName}</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Votre message</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Écrivez votre message..."
                              className="resize-none min-h-24"
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
                      className="w-full gradient-violet-accent text-white border-0"
                      data-testid="button-send-message"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Envoyer le message
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          ) : (
            <Card className="text-center py-16">
              <CardContent>
                <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-30" />
                <h3 className="text-lg font-semibold mb-2">Pas de conversation</h3>
                <p className="text-muted-foreground">Sélectionnez un contact dans la liste pour démarrer une conversation</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
