import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { type Server } from "http";
import { fileURLToPath } from 'url';

const __dirname = process.cwd();

export function log(message: string, source = "express") {
  const now = new Date();
  const formattedTime = now.toISOString();
  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function createViteServer() {
  const vite = await import('vite');
  return vite.createServer({
    root: path.resolve(__dirname, 'client'),
    logLevel: 'info',
    server: {
      middlewareMode: true,
      watch: {
        usePolling: true,
        interval: 100
      }
    },
    appType: 'spa'
  });
}

export async function setupVite(app: Express, server: Server) {
  const vite = await createViteServer();
  app.use(vite.middlewares);
  return vite;
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "dist/client");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
