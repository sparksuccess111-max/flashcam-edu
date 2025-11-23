import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, RotateCw, ArrowLeft, Download } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import jsPDF from "jspdf";
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

  const handleDownload = () => {
    if (!pack || !flashcards) return;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Dimensions pour 4x4 cartes par page
    const cardWidth = pageWidth / 4;
    const cardHeight = pageHeight / 4;
    const cardPadding = 2;

    let cardCount = 0;

    // Flashcards - 16 cartes par page (4x4)
    flashcards.forEach((card, index) => {
      // Déterminer la position sur la page (4x4 = 16 cartes)
      const positionOnPage = cardCount % 16;
      const row = Math.floor(positionOnPage / 4);
      const col = positionOnPage % 4;

      // Ajouter une nouvelle page si nécessaire
      if (cardCount > 0 && positionOnPage === 0) {
        doc.addPage();
      }

      const x = col * cardWidth + cardPadding;
      const y = row * cardHeight + cardPadding;
      const innerWidth = cardWidth - 2 * cardPadding;
      const innerHeight = cardHeight - 2 * cardPadding;

      // Dessiner la bordure de la carte
      doc.setDrawColor(150, 100, 200);
      doc.rect(x, y, innerWidth, innerHeight);

      // Diviser la carte en deux : question (haut) et réponse (bas)
      const midHeight = innerHeight / 2;

      // QUESTION SIDE (haut)
      // Numéro et titre du pack
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.text(`#${index + 1} - ${pack?.title || "Pack"}`, x + 1, y + 3);

      // Question text
      doc.setFontSize(6);
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, "bold");
      doc.text("Q:", x + 1, y + 6);
      
      doc.setFont(undefined, "normal");
      const questionLines = doc.splitTextToSize(
        card.question || "",
        innerWidth - 2
      );
      const maxQuestionLines = 4;
      const displayedQuestionLines = questionLines.slice(0, maxQuestionLines);
      doc.text(displayedQuestionLines, x + 1, y + 9, { maxWidth: innerWidth - 2 });

      // Ligne de séparation
      doc.setDrawColor(200, 150, 255);
      doc.line(x, y + midHeight, x + innerWidth, y + midHeight);

      // ANSWER SIDE (bas)
      // Answer text
      doc.setFontSize(6);
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, "bold");
      doc.text("R:", x + 1, y + midHeight + 3 as number);

      doc.setFont(undefined, "normal");
      const answerLines = doc.splitTextToSize(
        card.answer || "",
        innerWidth - 2
      );
      const maxAnswerLines = 4;
      const displayedAnswerLines = answerLines.slice(0, maxAnswerLines);
      doc.text(displayedAnswerLines, x + 1, y + midHeight + 6, { maxWidth: innerWidth - 2 });

      cardCount++;
    });

    // Save PDF
    doc.save(`${(pack?.title || "cartes").replace(/\s+/g, "_")}_cartes.pdf`);
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
      <div className="container mx-auto px-4 py-0 max-w-4xl flex flex-col flex-1">
        <Button
          variant="ghost"
          onClick={() => setLocation("/")}
          className="mb-0 w-fit"
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>

        <div className="flex-1 flex flex-col items-center justify-center w-full pb-40">
          <div className="w-full max-w-2xl mb-4 text-center">
            <h2 className="text-sm font-medium text-muted-foreground/70 uppercase tracking-widest">{pack.title}</h2>
          </div>
          <Card
            className="gradient-card w-full max-w-2xl aspect-video flex items-center justify-center cursor-pointer hover:shadow-2xl active-elevate-2 transition-all shadow-xl border-2 border-violet-300 dark:border-violet-700"
            onClick={handleFlip}
            data-testid="card-flashcard"
          >
            <CardContent className="p-4 sm:p-6 text-center h-full flex flex-col items-center justify-center">
              <div className="mb-2">
                <span className={`text-xs font-semibold uppercase tracking-wider ${isFlipped ? "text-green-500" : "text-yellow-500"}`}>
                  {isFlipped ? "Réponse" : "Question"}
                </span>
              </div>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold leading-relaxed text-foreground" data-testid={isFlipped ? "text-answer" : "text-question"}>
                {isFlipped ? currentCard?.answer : currentCard?.question}
              </p>
              <div className="mt-2 text-xs text-muted-foreground/50">
                Cliquez pour {isFlipped ? "la question" : "la réponse"}
              </div>
            </CardContent>
          </Card>

          <div className="w-full max-w-2xl space-y-0 mt-4">
            <div className="flex items-center justify-between mb-0">
              <span className="text-sm text-muted-foreground/70" data-testid="text-progress">
                Carte {currentIndex + 1} sur {flashcards.length}
              </span>
            </div>
            <Progress value={progress} />
          </div>

          <div className="flex items-center justify-between gap-4 mt-4 flex-wrap">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              data-testid="button-previous"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Précédent
            </Button>
            <div className="flex gap-2">
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
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                data-testid="button-download"
              >
                <Download className="h-4 w-4 mr-2" />
                Télécharger PDF
              </Button>
            </div>
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
    </div>
  );
}
