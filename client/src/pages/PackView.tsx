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

  const sortedCards = flashcards?.sort((a, b) => a.order - b.order) || [];
  const currentCard = sortedCards[currentIndex];
  const progress = sortedCards.length > 0 ? ((currentIndex + 1) / sortedCards.length) * 100 : 0;

  const handleNext = () => {
    if (currentIndex < sortedCards.length - 1) {
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

  if (!pack || sortedCards.length === 0) {
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

      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2" data-testid="text-pack-title">{pack.title}</h1>
        {pack.description && (
          <p className="text-muted-foreground" data-testid="text-pack-description">{pack.description}</p>
        )}
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground" data-testid="text-progress">
            Card {currentIndex + 1} of {sortedCards.length}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            data-testid="button-reset"
          >
            <RotateCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
        <Progress value={progress} />
      </div>

      <Card
        className="mb-6 min-h-[400px] flex items-center justify-center cursor-pointer hover-elevate active-elevate-2 transition-all"
        onClick={handleFlip}
        data-testid="card-flashcard"
      >
        <CardContent className="p-12 text-center">
          <div className="mb-4">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {isFlipped ? "Answer" : "Question"}
            </span>
          </div>
          <p className="text-2xl font-medium leading-relaxed" data-testid={isFlipped ? "text-answer" : "text-question"}>
            {isFlipped ? currentCard.answer : currentCard.question}
          </p>
          <div className="mt-8 text-sm text-muted-foreground">
            Click card to {isFlipped ? "see question" : "reveal answer"}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          data-testid="button-previous"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        <Button
          variant="outline"
          onClick={handleNext}
          disabled={currentIndex === sortedCards.length - 1}
          data-testid="button-next"
        >
          Next
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
