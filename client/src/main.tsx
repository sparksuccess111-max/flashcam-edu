import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Suppress Vite HMR WebSocket errors that don't affect app functionality
window.addEventListener("unhandledrejection", (event) => {
  try {
    const message = event.reason?.message || event.reason?.toString?.() || "";
    const stack = event.reason?.stack || "";
    
    // Check for Vite HMR WebSocket errors
    if (
      message.includes("Failed to construct 'WebSocket'") &&
      (message.includes("localhost:undefined") || stack.includes("setupWebSocket"))
    ) {
      event.preventDefault();
    }
  } catch (e) {
    // Silently ignore any errors in the handler itself
  }
});

createRoot(document.getElementById("root")!).render(<App />);
