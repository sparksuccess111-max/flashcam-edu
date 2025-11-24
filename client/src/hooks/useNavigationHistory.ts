import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";

export function useNavigationHistory() {
  const [location, navigate] = useLocation();
  const historyStack = useRef<string[]>([]);
  const currentIndex = useRef<number>(-1);
  const isNavigatingViaButtons = useRef<boolean>(false);

  // Tracker les changements de route via wouter
  useEffect(() => {
    // Initialiser l'historique
    if (historyStack.current.length === 0) {
      historyStack.current.push(location);
      currentIndex.current = 0;
      return;
    }

    // Si on navigue via les boutons retour/avant, ne pas ajouter à l'historique
    if (isNavigatingViaButtons.current) {
      isNavigatingViaButtons.current = false;
      return;
    }

    // Nouvelle navigation normale
    const lastPath = historyStack.current[currentIndex.current];
    if (location !== lastPath) {
      // Supprimer tout l'historique après l'index actuel
      historyStack.current.splice(currentIndex.current + 1);

      // Ajouter la nouvelle route
      historyStack.current.push(location);
      currentIndex.current = historyStack.current.length - 1;
    }
  }, [location]);

  // Écouter les boutons retour/avant de la souris
  useEffect(() => {
    const handleMouseButton = (e: MouseEvent) => {
      if (e.button === 3 || e.button === 4) {
        e.preventDefault();
        e.stopPropagation();

        let canNavigate = false;

        if (e.button === 3) {
          // Bouton retour
          if (currentIndex.current > 0) {
            currentIndex.current--;
            canNavigate = true;
          }
        } else if (e.button === 4) {
          // Bouton avant
          if (currentIndex.current < historyStack.current.length - 1) {
            currentIndex.current++;
            canNavigate = true;
          }
        }

        if (canNavigate) {
          isNavigatingViaButtons.current = true;
          navigate(historyStack.current[currentIndex.current]);
        }

        return false;
      }
    };

    document.addEventListener("mousedown", handleMouseButton as any, true);

    return () => {
      document.removeEventListener("mousedown", handleMouseButton as any, true);
    };
  }, [navigate]);
}
