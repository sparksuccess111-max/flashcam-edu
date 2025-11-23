import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Suppress Vite HMR WebSocket errors that don't affect app functionality
const suppressViteErrors = (event: PromiseRejectionEvent) => {
  try {
    const reason = event.reason;
    const message = reason?.message || reason?.toString?.() || "";
    const stack = reason?.stack || "";
    
    // Vite HMR WebSocket errors in Replit
    if (
      typeof message === "string" &&
      message.includes("Failed to construct 'WebSocket'")
    ) {
      event.preventDefault();
      return;
    }
    
    // setupWebSocket error
    if (typeof stack === "string" && stack.includes("setupWebSocket")) {
      event.preventDefault();
      return;
    }
  } catch (e) {
    // Ignore any errors in this handler
  }
};

window.addEventListener("unhandledrejection", suppressViteErrors);

createRoot(document.getElementById("root")!).render(<App />);
