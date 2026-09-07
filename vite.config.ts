import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { createServer } from "./server";
import { initSockets } from "./server/sockets";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    fs: {
      allow: ["./client", "./shared", "index.html"],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
  },
  build: {
    outDir: "dist/spa",
  },
  plugins: [react(), stripCspPlugin(), expressPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
}));

/**
 * Strips Content-Security-Policy headers from all dev server responses.
 * Required because Vite 8 and/or Helmet set a restrictive CSP that blocks
 * the inline preamble script injected by @vitejs/plugin-react for Fast Refresh.
 */
function stripCspPlugin(): Plugin {
  return {
    name: "strip-csp",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((_req, res, next) => {
        const originalWriteHead = res.writeHead.bind(res);
        res.writeHead = function (
          statusCode: number,
          ...args: any[]
        ) {
          res.removeHeader("Content-Security-Policy");
          res.removeHeader("Content-Security-Policy-Report-Only");
          return originalWriteHead(statusCode, ...args);
        } as any;
        next();
      });
    },
  };
}

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve", // Only apply during development (serve mode)
    configureServer(server) {
      const app = createServer();

      // Add Express app as middleware to Vite dev server
      server.middlewares.use(app);

      if (server.httpServer) {
        initSockets(server.httpServer);
      }
    },
  };
}
