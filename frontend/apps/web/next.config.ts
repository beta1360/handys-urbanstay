import type { NextConfig } from "next";

const APP_API_PATH = "/api/v1/app";

function getApiBaseUrl() {
  const apiBaseUrl = process.env.API_BASE_URL;

  if (!apiBaseUrl) {
    throw new Error("API_BASE_URL 환경 변수가 설정되지 않았습니다.");
  }

  return apiBaseUrl;
}

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return [
      {
        source: `${APP_API_PATH}/:path*`,
        destination: `${getApiBaseUrl()}${APP_API_PATH}/:path*`,
      },
    ];
  },
};

export default nextConfig;
