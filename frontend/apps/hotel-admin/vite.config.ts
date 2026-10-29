import { defineConfig, loadEnv } from "vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const APP_API_PATH = "/api/v1/hotel-admin";

function getApiBaseUrl(mode: string) {
  const { API_BASE_URL: apiBaseUrl } = loadEnv(mode, process.cwd(), "");

  if (!apiBaseUrl) {
    throw new Error("API_BASE_URL 환경 변수가 설정되지 않았습니다.");
  }

  return apiBaseUrl;
}

export default defineConfig(({ mode }) => ({
  resolve: { tsconfigPaths: true },
  plugins: [tailwindcss(), tanstackRouter(), viteReact()],
  server: {
    port: 5174,
    strictPort: true,
    proxy: {
      [APP_API_PATH]: getApiBaseUrl(mode),
    },
  },
}));
