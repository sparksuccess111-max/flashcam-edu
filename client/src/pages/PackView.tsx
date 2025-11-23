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
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    const cols = 4;
    const rows = 4;
    const cardsPerPage = cols * rows;
    const cardW = pageWidth / cols;
    const cardH = pageHeight / rows;
    const margin = 6;
    const fontSize = 10;
    const numFontSize = 14;

    // Fonction pour afficher du texte centré multi-lignes
    const drawMultilineText = (
      text: string,
      cx: number,
      cy: number,
      width: number,
      height: number,
      size: number
    ) => {
      doc.setFontSize(size);
      const lines = doc.splitTextToSize(text, width - 2 * margin);
      const lineHeight = size * 0.5;
      const totalHeight = lines.length * lineHeight;
      const startY = cy + totalHeight / 2;
      
      lines.slice(0, Math.floor(height / lineHeight)).forEach((line: string, idx: number) => {
        doc.text(line, cx, startY - idx * lineHeight, { align: "center", maxWidth: width - 2 * margin });
      });
    };

    // Fonction pour dessiner une page
    const drawPage = (isRecto: boolean, pageStartIndex: number) => {
      const pageCards = flashcards.slice(pageStartIndex, pageStartIndex + cardsPerPage);
      
      pageCards.forEach((card, i) => {
        const idx = pageStartIndex + i;
        let col = i % cols;
        const row = rows - 1 - Math.floor(i / cols);

        // Miroir horizontal pour verso
        if (!isRecto) {
          col = cols - 1 - col;
        }

        const x = col * cardW;
        const y = row * cardH;
        const cx = x + cardW / 2;
        const cy = y + cardH / 2;

        // Numéro en haut-left
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(numFontSize);
        doc.text(String(idx + 1), x + margin, y + cardH - margin);

        // Texte centré (Question recto / Réponse verso)
        const text = isRecto ? (card.question || "") : (card.answer || "");
        doc.setFont("Helvetica", "normal");
        drawMultilineText(text, cx, cy, cardW, cardH, fontSize);

        // Signature en bas-droite
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(6);
        doc.text("Camille", x + cardW - margin - 1, y + margin + 1, { align: "right" });
      });

      // Traits de découpe (lignes verticales et horizontales)
      doc.setLineWidth(0.3);
      doc.setDrawColor(0, 0, 0);

      // Lignes verticales
      for (let col = 1; col < cols; col++) {
        doc.line(col * cardW, 0, col * cardW, pageHeight);
      }

      // Lignes horizontales
      for (let row = 1; row < rows; row++) {
        doc.line(0, row * cardH, pageWidth, row * cardH);
      }
    };

    // Recto (Questions)
    for (let pageStart = 0; pageStart < flashcards.length; pageStart += cardsPerPage) {
      drawPage(true, pageStart);
      doc.addPage();
    }

    // Verso (Réponses)
    for (let pageStart = 0; pageStart < flashcards.length; pageStart += cardsPerPage) {
      drawPage(false, pageStart);
      if (pageStart + cardsPerPage < flashcards.length) {
        doc.addPage();
      }
    }

    // Save PDF
    doc.save(`${(pack?.title || "cartes").replace(/\s+/g, "_")}_decoupables.pdf`);
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
