// vite.config.ts
/// <reference types="vite/client" />
/// <reference types="vitest" />
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig } from "vitest/config";

import react from "@vitejs/plugin-react";

export default defineConfig({
  resolve: {},
  optimizeDeps: {
    include: ["tslib", "@apollo/client", "graphql-ws"],
  },
  plugins: [
    react(),
    visualizer({
      filename: "./analyze/stats.html", // Path to visualizer output
      template: "treemap", // Visualization types
      open: true, // Automatically open the visualization in the browser
      gzipSize: true, // Show the compressed size
      brotliSize: true, // Show the Brotli compressed size
    }),
  ],
  server: {
    open: true,
  },
  test: {
    globals: true,
    environment: "jsdom",
    reporters: ["default", "junit"],
    outputFile: { junit: "./reports/junit/junit.xml" },
    setupFiles: ["vitest.setup.ts"],
    coverage: {
      provider: "istanbul",
      include: ["src/**/*"],
      exclude: ["src/**/*.test.ts*", "src/main.tsx", "src/App.tsx"],
      reporter: ["text", "json-summary", "html"],
      thresholds: {
        perFile: false,
        statements: 50,
        lines: 50,
      },
    },
  },
});
