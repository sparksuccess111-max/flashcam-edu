import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Suppress Vite HMR WebSocket errors that don't affect app functionality
window.addEventListener("unhandledrejection", (event) => {
  const message = event.reason?.message || event.reason?.toString?.() || "";
  if (
    message.includes("Failed to construct 'WebSocket'") &&
    message.includes("localhost:undefined")
  ) {
    event.preventDefault();
    return;
  }
});

createRoot(document.getElementById("root")!).render(<App />);
