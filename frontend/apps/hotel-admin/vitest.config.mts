import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

const TEST_TIMEOUT_MS = 15_000;

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest-setup.ts"],
    testTimeout: TEST_TIMEOUT_MS,
  },
});
