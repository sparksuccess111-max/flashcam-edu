import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, RotateCw, ArrowLeft } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { Flashcard, Pack } from "@shared/schema";

export default function PackView() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const { data: pack, isLoading: packLoading } = useQuery<Pack>({
    queryKey: ["/api/packs", id],
  });

  const { data: flashcards, isLoading: cardsLoading } = useQuery<Flashcard[]>({
    queryKey: ["/api/packs", id, "flashcards"],
    enabled: !!id,
  });

  const isLoading = packLoading || cardsLoading;

  const currentCard = flashcards?.[currentIndex];
  const progress = flashcards && flashcards.length > 0 ? ((currentIndex + 1) / flashcards.length) * 100 : 0;

  const handleNext = () => {
    if (flashcards && currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-6 w-96 mb-8" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!pack || !flashcards || flashcards.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => setLocation("/")}
          className="mb-6"
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Packs
        </Button>
        <Card className="text-center py-12">
          <CardContent>
            <h3 className="text-xl font-semibold mb-2">No Flashcards Available</h3>
            <p className="text-muted-foreground">
              This pack doesn't have any flashcards yet.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-violet flex flex-col">
      <div className="container mx-auto px-4 py-8 max-w-4xl flex-1 flex flex-col">
        <Button
          variant="ghost"
          onClick={() => setLocation("/")}
          className="mb-6 w-fit"
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>

        <div className="flex-1 flex flex-col items-center justify-center py-8">
          <div className="w-full max-w-2xl mb-6 text-center">
            <h2 className="text-sm font-medium text-muted-foreground/70 uppercase tracking-widest">{pack.title}</h2>
          </div>
          <Card
            className="gradient-card w-full max-w-2xl min-h-[450px] flex items-center justify-center cursor-pointer hover:shadow-2xl active-elevate-2 transition-all shadow-xl border-2 border-violet-300 dark:border-violet-700"
            onClick={handleFlip}
            data-testid="card-flashcard"
          >
            <CardContent className="p-16 text-center">
              <div className="mb-8">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/50">
                  {isFlipped ? "Réponse" : "Question"}
                </span>
              </div>
              <p className="text-3xl font-semibold leading-relaxed text-foreground" data-testid={isFlipped ? "text-answer" : "text-question"}>
                {isFlipped ? currentCard?.answer : currentCard?.question}
              </p>
              <div className="mt-12 text-xs text-muted-foreground/50">
                Cliquez pour {isFlipped ? "la question" : "la réponse"}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 mt-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-muted-foreground/70" data-testid="text-progress">
              Carte {currentIndex + 1} sur {flashcards.length}
            </span>
          </div>
          <Progress value={progress} />
        </div>

        <div className="flex items-center justify-between gap-4 mt-8">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            data-testid="button-previous"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Précédent
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            data-testid="button-reset"
          >
            <RotateCw className="h-4 w-4 mr-2" />
            Réinitialiser
          </Button>
          <Button
            variant="outline"
            onClick={handleNext}
            disabled={currentIndex === flashcards.length - 1}
            data-testid="button-next"
          >
            Suivant
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
