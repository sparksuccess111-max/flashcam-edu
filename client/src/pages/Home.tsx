import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, GraduationCap, Layers } from "lucide-react";
import type { Pack, Flashcard } from "@shared/schema";
import { useAuth } from "@/lib/auth-context";
import { SUBJECTS } from "@shared/schema";

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
        <div className="grid grid-cols-1 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-96" />
          ))}
        </div>
      </div>
    );
  }

  const publishedPacks = packs?.filter(pack => pack.published) || [];

  // Group packs by subject
  const packsGroupedBySubject = SUBJECTS.reduce((acc, subject) => {
    acc[subject] = publishedPacks.filter(p => p.subject === subject);
    return acc;
  }, {} as Record<string, Pack[]>);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400 bg-clip-text text-transparent">
          Packs de Flashcard
        </h1>
        {user && (
          <p className="text-muted-foreground">
            Bienvenue, {user.firstName}!
          </p>
        )}
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
              <h3 className="text-xl font-semibold mb-2">Aucun pack disponible</h3>
              <p className="text-muted-foreground">
                Il n'y a pas de packs de flashcard publiés pour le moment. Revenez bientôt!
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {SUBJECTS.map(subject => {
            const subjectPacks = packsGroupedBySubject[subject] || [];
            if (subjectPacks.length === 0) return null;

            return (
              <div key={subject}>
                <div className="mb-4">
                  <h2 className="text-2xl font-semibold text-violet-600 dark:text-violet-400 mb-1">
                    {subject}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {subjectPacks.length} pack{subjectPacks.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {subjectPacks.map((pack) => (
                    <PackCard key={pack.id} pack={pack} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PackCard({ pack }: { pack: Pack }) {
  const { data: flashcards, isLoading } = useQuery<Flashcard[]>({
    queryKey: ["/api/packs", pack.id, "flashcards"],
  });

  const cardCount = flashcards?.length || 0;

  return (
    <Card
      className="gradient-card min-h-80 flex flex-col hover-elevate active-elevate-2 transition-all cursor-pointer border-violet-200 dark:border-violet-800 shadow-md hover:shadow-lg"
      onClick={() => window.location.href = `/pack/${pack.id}`}
      data-testid={`card-pack-${pack.id}`}
    >
      <CardHeader className="flex-1">
        <div className="flex items-start gap-3">
          <div className="gradient-violet-accent p-2 rounded-md flex-shrink-0">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg mb-1 break-words" data-testid={`text-pack-title-${pack.id}`}>
              {pack.title}
            </CardTitle>
            <CardDescription className="line-clamp-2" data-testid={`text-pack-description-${pack.id}`}>
              {pack.description || "Pas de description"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {isLoading ? "..." : `${cardCount} carte${cardCount !== 1 ? "s" : ""}`}
          </span>
        </div>
        <Button variant="outline" className="w-full pointer-events-none" data-testid={`button-study-${pack.id}`}>
          Commencer à étudier
        </Button>
      </CardContent>
    </Card>
  );
}
