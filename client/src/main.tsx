import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// AGGRESSIVE: Override WebSocket constructor to prevent Vite HMR localhost:undefined errors
const OriginalWebSocket = window.WebSocket;
(window as any).WebSocket = function(url: string, ...args: any[]) {
  // Block invalid localhost:undefined URLs from Vite HMR
  if (typeof url === "string" && (
    url.includes("localhost:undefined") ||
    url.includes("undefined/?")
  )) {
    return {
      readyState: 3, // CLOSED
      close: () => {},
      send: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true,
    } as any;
  }
  return new OriginalWebSocket(url, ...args);
};

// Also suppress unhandledrejection for any Vite HMR errors
window.addEventListener("unhandledrejection", (event) => {
  try {
    const reason = event.reason;
    const msg = reason?.message || reason?.toString?.() || "";
    
    if (typeof msg === "string" && (
      msg.includes("Failed to construct 'WebSocket'") ||
      msg.includes("localhost:undefined")
    )) {
      event.preventDefault();
    }
  } catch (e) {
    // ignore
  }
});

createRoot(document.getElementById("root")!).render(<App />);
