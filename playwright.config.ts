import { defineConfig, devices } from "@playwright/test";

const BASE_URL = "http://localhost:3000";
const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  // En CI, un `test.only` olvidado debe romper la build en lugar de saltarse el resto.
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  reporter: isCI ? "github" : "list",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: BASE_URL,
    // En local se reutiliza el servidor que ya esté levantado.
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
});
