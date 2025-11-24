import { type Server } from "node:http";

import express, {
  type Express,
  type Request,
  Response,
  NextFunction,
} from "express";

import { registerRoutes } from "./routes";
import { logger } from "./logger";

export function log(message: string, source = "express") {
  logger.info(message, source);
}

export const app = express();

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let extra = "";
      if (capturedJsonResponse) {
        let resp = JSON.stringify(capturedJsonResponse);
        if (resp.length > 100) {
          resp = resp.slice(0, 99) + "…";
        }
        extra = resp;
      }

      logger.api(req.method, path, res.statusCode, duration, extra);
    }
  });

  next();
});

// Internal keep-alive ping function
function startAutoPing(port: number) {
  const pingInterval = 5 * 60 * 1000; // 5 minutes in milliseconds
  const pingUrl = `http://localhost:${port}/ping`;
  let pingCount = 0;

  const pingTask = setInterval(async () => {
    pingCount++;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(pingUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        logger.debug(`[Ping #${pingCount}] Auto-ping successful (${response.status})`, "server");
      } else {
        logger.warn(`[Ping #${pingCount}] Auto-ping failed (${response.status})`, "server");
      }
    } catch (error: any) {
      logger.error(`[Ping #${pingCount}] Auto-ping error: ${error.message}`, "server", error);
    }
  }, pingInterval);

  // Prevent process from keeping the interval alive if all other connections close
  if (pingTask.unref) {
    pingTask.unref();
  }
  
  logger.info(`Auto-ping started (every ${pingInterval / 1000}s)`, "server");
  
  // Also do an immediate ping on startup
  fetch(pingUrl).catch((error) => {
    logger.debug(`Initial startup ping failed: ${error.message}`, "server");
  });
}

export default async function runApp(
  setup: (app: Express, server: Server) => Promise<void>,
) {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    logger.error(`HTTP ${status}: ${message}`, "express", err);
    res.status(status).json({ message });
  });

  // importantly run the final setup after setting up all the other routes so
  // the catch-all route doesn't interfere with the other routes
  await setup(app, server);

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  const env = process.env.NODE_ENV || "development";
  
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port} (${env})`);
    log("Database connected", "db");
    log("WebSocket server ready at /ws", "ws");
    
    // Start internal auto-ping to keep app alive on free tier
    // This helps prevent Replit free tier (15 min inactivity timeout)
    startAutoPing(port);
  });

  // Keep-alive: Prevent server timeout on free tier hosting
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;

  // Graceful shutdown on signals
  process.on("SIGTERM", () => {
    logger.warn("SIGTERM received, shutting down gracefully", "server");
    server.close(() => {
      logger.info("Server closed", "server");
      process.exit(0);
    });
  });

  process.on("SIGINT", () => {
    logger.warn("SIGINT received, shutting down gracefully", "server");
    server.close(() => {
      logger.info("Server closed", "server");
      process.exit(0);
    });
  });
}
