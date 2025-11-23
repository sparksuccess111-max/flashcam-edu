import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, GraduationCap } from "lucide-react";
import type { Pack } from "@shared/schema";
import { useAuth } from "@/lib/auth-context";

export default function Home() {
  const { user } = useAuth();
  
  const { data: packs, isLoading } = useQuery<Pack[]>({
    queryKey: ["/api/packs"],
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  const publishedPacks = packs?.filter(pack => pack.published) || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Available Flashcard Packs</h1>
        <p className="text-muted-foreground">
          {user ? `Welcome back, ${user.username}!` : "Welcome! Please login to access all features."}
        </p>
      </div>

      {publishedPacks.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <div className="bg-muted p-4 rounded-full">
                <BookOpen className="h-12 w-12 text-muted-foreground" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">No Packs Available Yet</h3>
              <p className="text-muted-foreground">
                There are no published flashcard packs at the moment. Check back soon!
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {publishedPacks.map((pack) => (
            <Card
              key={pack.id}
              className="gradient-card h-full hover-elevate active-elevate-2 transition-all cursor-pointer border-violet-200 dark:border-violet-800 shadow-md hover:shadow-lg"
              onClick={() => window.location.href = `/pack/${pack.id}`}
              data-testid={`card-pack-${pack.id}`}
            >
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="gradient-violet-accent p-2 rounded-md flex-shrink-0">
                    <GraduationCap className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg mb-1 break-words" data-testid={`text-pack-title-${pack.id}`}>
                      {pack.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2" data-testid={`text-pack-description-${pack.id}`}>
                      {pack.description || "No description"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full pointer-events-none" data-testid={`button-study-${pack.id}`}>
                  Start Studying
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
