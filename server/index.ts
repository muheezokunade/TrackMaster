import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add CORS headers for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

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
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = process.env.PORT || 3000;
  
  // Handle server cleanup and port conflicts
  const startServer = () => {
    server.listen(port, () => {
      log(`serving on port ${port}`);
    }).on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        log(`Port ${port} is busy, trying to close existing connections...`);
        require('child_process').exec(`lsof -i :${port} | grep LISTEN | awk '{print $2}' | xargs kill -9`, (err: any) => {
          if (err) {
            log(`Failed to kill process on port ${port}. Please close it manually.`);
            process.exit(1);
          } else {
            log(`Successfully killed process on port ${port}, restarting server...`);
            setTimeout(startServer, 1000);
          }
        });
      } else {
        log(`Failed to start server: ${error.message}`);
        process.exit(1);
      }
    });
  };

  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
      log('HTTP server closed');
      process.exit(0);
    });
  });

  startServer();
})();
