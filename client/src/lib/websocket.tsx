import { useEffect, useRef } from "react";
import { queryClient } from "@/lib/queryClient";

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    
    // Handle Vite HMR misconfiguration in Replit where host contains :undefined
    let host = window.location.host;
    if (host.includes(":undefined")) {
      host = host.replace(":undefined", "");
    }
    
    // Fallback: if host is empty or still invalid, use current location
    if (!host || host === "localhost") {
      const port = window.location.port && window.location.port !== "undefined" ? ":" + window.location.port : "";
      host = window.location.hostname + port;
    }
    
    const wsUrl = `${protocol}//${host}/ws`;

    const connect = () => {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connected");
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log("WebSocket message received:", message);

          switch (message.type) {
            case "pack-created":
            case "pack-updated":
            case "pack-deleted":
              queryClient.invalidateQueries({ queryKey: ["/api/packs"] });
              break;

            case "flashcard-created":
            case "flashcard-updated":
            case "flashcard-deleted":
              if (message.data?.packId) {
                queryClient.invalidateQueries({ 
                  queryKey: ["/api/packs", message.data.packId, "flashcards"] 
                });
              }
              break;

            case "message-received":
            case "notifications-updated":
              queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
              queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
              break;

            case "user-updated":
              // Sync user updates to localStorage and emit event
              const storedUser = localStorage.getItem("user");
              if (storedUser) {
                try {
                  const user = JSON.parse(storedUser);
                  const updatedUser = { ...user, ...message.data };
                  localStorage.setItem("user", JSON.stringify(updatedUser));
                  // Emit custom event so auth context can update
                  window.dispatchEvent(new CustomEvent("user-updated", { detail: updatedUser }));
                } catch (e) {
                  console.error("Failed to update user from websocket:", e);
                }
              }
              break;
          }
        } catch (error) {
          console.error("WebSocket message parse error:", error);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected, reconnecting in 3s...");
        setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);
}
