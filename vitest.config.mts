import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  // Resolución nativa de los alias `@/…` a partir de tsconfig.json.
  resolve: { tsconfigPaths: true },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    // Los tests de extremo a extremo viven en e2e/ y los ejecuta Playwright.
    exclude: ["node_modules/**", ".next/**", "e2e/**"],
  },
});
