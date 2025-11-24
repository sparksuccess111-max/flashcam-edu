import { useState, useEffect, useRef } from "react";
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
import { useAuth } from "@/lib/auth-context";
import { insertMessageSchema } from "@shared/schema";
import type { User, Message } from "@shared/schema";
import { Send, MessageSquare, Search } from "lucide-react";
import { z } from "zod";

const sendMessageSchema = insertMessageSchema.extend({
  toUserId: z.string().min(1, "Recipient is required"),
});

export default function Messages() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: recipients = [] } = useQuery<User[]>({
    queryKey: ["/api/messages/recipients"],
    refetchInterval: 2000,
  });

  const { data: allMessages = [] } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
    refetchInterval: 1000,
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
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'envoyer le message.",
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      form.handleSubmit(onSubmit)();
    }
  };

  const selectedUser = recipients.find(u => u.id === selectedUserId);
  
  const conversationMessages = allMessages
    .filter(m => (m.fromUserId === selectedUserId && m.toUserId === currentUser?.id) || 
                  (m.fromUserId === currentUser?.id && m.toUserId === selectedUserId))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const filteredRecipients = recipients.filter(user =>
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleLabel = (role: string) => {
    return role === "admin" ? "Administrateur" : role === "teacher" ? "Professeur" : "Étudiant";
  };

  const getUnreadCountForContact = (contactId: string) => {
    return allMessages.filter(m => m.fromUserId === contactId && m.toUserId === currentUser?.id && !m.read).length;
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversationMessages]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Messages</h1>
        <p className="text-muted-foreground">Communiquez en temps réel avec vos collègues</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[70vh]">
        {/* Contacts */}
        <div className="lg:col-span-1 flex flex-col">
          <Card className="flex-1 flex flex-col overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg">Contacts</CardTitle>
              <CardDescription>Sélectionnez un contact</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Chercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 text-sm"
                  data-testid="input-search-recipients"
                />
              </div>

              <div className="space-y-2 overflow-y-auto flex-1">
                {filteredRecipients.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {recipients.length === 0 ? "Aucun contact" : "Pas de résultats"}
                  </p>
                ) : (
                  filteredRecipients.map(contact => {
                    const unreadCount = getUnreadCountForContact(contact.id);
                    return (
                      <button
                        key={contact.id}
                        onClick={() => {
                          setSelectedUserId(contact.id);
                          form.setValue("toUserId", contact.id);
                        }}
                        className={`w-full text-left p-2 rounded-md transition-colors border text-sm relative ${
                          selectedUserId === contact.id
                            ? "bg-violet-100 dark:bg-violet-900 border-violet-300 dark:border-violet-700"
                            : "border-transparent hover:bg-muted"
                        }`}
                        data-testid={`button-select-user-${contact.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium truncate">{contact.firstName} {contact.lastName}</div>
                            <div className="text-xs text-muted-foreground">{getRoleLabel(contact.role)}</div>
                          </div>
                          {unreadCount > 0 && (
                            <Badge className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-red-500 text-white border-0 text-xs flex-shrink-0">
                              {unreadCount}
                            </Badge>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {selectedUser ? (
            <>
              {/* Header */}
              <Card className="flex-shrink-0">
                <CardHeader className="py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{selectedUser.firstName} {selectedUser.lastName}</CardTitle>
                      <CardDescription className="text-xs">{getRoleLabel(selectedUser.role)}</CardDescription>
                    </div>
                    <Badge>{getRoleLabel(selectedUser.role)}</Badge>
                  </div>
                </CardHeader>
              </Card>

              {/* Messages */}
              <Card className="flex-1 flex flex-col overflow-hidden">
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-3 max-h-96">
                  {conversationMessages.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <MessageSquare className="h-12 w-12 mx-auto mb-2 text-muted-foreground opacity-30" />
                        <p className="text-sm text-muted-foreground">Aucun message</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {conversationMessages.map(msg => (
                        <div
                          key={msg.id}
                          className={`flex gap-2 ${msg.fromUserId === currentUser?.id ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg text-sm ${
                              msg.fromUserId === currentUser?.id
                                ? "bg-violet-500 text-white rounded-br-none"
                                : "bg-muted text-foreground rounded-bl-none"
                            }`}
                            data-testid={`message-${msg.id}`}
                          >
                            <p className="break-words">{msg.content}</p>
                            <div className={`text-xs mt-1 ${
                              msg.fromUserId === currentUser?.id
                                ? "text-violet-100"
                                : "text-muted-foreground"
                            }`}>
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Form */}
              <Card className="flex-shrink-0">
                <CardContent className="pt-6">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                      <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea
                                placeholder="Écrivez votre message..."
                                className="resize-none min-h-16"
                                data-testid="input-message-content"
                                onKeyDown={handleKeyDown}
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
                        size="sm"
                        data-testid="button-send-message"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Envoyer
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="flex-1 flex items-center justify-center">
              <CardContent className="text-center">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-30" />
                <h3 className="font-semibold mb-2">Pas de conversation sélectionnée</h3>
                <p className="text-sm text-muted-foreground">Sélectionnez un contact pour démarrer</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
