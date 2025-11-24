import { useEffect, useRef } from "react";
import { useLocation } from "wouter";

export function useNavigationHistory() {
  const [, navigate] = useLocation();
  const historyStack = useRef<string[]>([]);
  const currentIndex = useRef<number>(-1);

  useEffect(() => {
    // Initialiser avec la page actuelle
    if (historyStack.current.length === 0) {
      historyStack.current.push(window.location.pathname);
      currentIndex.current = 0;
    }

    // Écouter les changements de route (wouter)
    const handleLocationChange = () => {
      const newPath = window.location.pathname;
      const lastPath = historyStack.current[currentIndex.current];

      // Si on n'est pas en train de naviguer via les boutons retour/avant
      if (newPath !== lastPath) {
        // Supprimer tout l'historique après l'index actuel (comme dans les vrais navigateurs)
        historyStack.current.splice(currentIndex.current + 1);

        // Ajouter la nouvelle route
        historyStack.current.push(newPath);
        currentIndex.current = historyStack.current.length - 1;
      }
    };

    // Observer tous les changements de route
    window.addEventListener("popstate", handleLocationChange);

    return () => {
      window.removeEventListener("popstate", handleLocationChange);
    };
  }, []);

  useEffect(() => {
    // Écouter les boutons retour/avant de la souris
    const handleMouseButton = (e: MouseEvent) => {
      // Bouton retour de la souris = 3
      // Bouton avant de la souris = 4
      if (e.button === 3) {
        e.preventDefault();
        e.stopPropagation();
        // Retour
        if (currentIndex.current > 0) {
          currentIndex.current--;
          navigate(historyStack.current[currentIndex.current]);
        }
        return false;
      } else if (e.button === 4) {
        e.preventDefault();
        e.stopPropagation();
        // Avant
        if (currentIndex.current < historyStack.current.length - 1) {
          currentIndex.current++;
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
