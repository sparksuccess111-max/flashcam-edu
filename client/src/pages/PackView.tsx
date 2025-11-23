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
    const margin = 10;
    const contentWidth = pageWidth - 2 * margin;
    let yPosition = margin;

    // Title
    doc.setFontSize(18);
    doc.setTextColor(99, 102, 241); // violet-600
    doc.text(pack.title, margin, yPosition);
    yPosition += 15;

    // Flashcards
    flashcards.forEach((card, index) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = margin;
      }

      // Card number
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Carte ${index + 1}`, margin, yPosition);
      yPosition += 5;

      // Question
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, "bold");
      doc.text("Question:", margin, yPosition);
      yPosition += 5;

      doc.setFont(undefined, "normal");
      doc.setFontSize(11);
      const questionLines = doc.splitTextToSize(card.question, contentWidth);
      doc.text(questionLines, margin, yPosition);
      yPosition += questionLines.length * 5 + 3;

      // Answer
      doc.setFont(undefined, "bold");
      doc.setFontSize(12);
      doc.text("Réponse:", margin, yPosition);
      yPosition += 5;

      doc.setFont(undefined, "normal");
      doc.setFontSize(11);
      const answerLines = doc.splitTextToSize(card.answer, contentWidth);
      doc.text(answerLines, margin, yPosition);
      yPosition += answerLines.length * 5 + 10;
    });

    // Save PDF
    doc.save(`${pack.title.replace(/\s+/g, "_")}.pdf`);
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
