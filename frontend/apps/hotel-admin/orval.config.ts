import { defineConfig } from "orval";

const API_DOCS_URL = "http://localhost:8080/v3/api-docs/hotel-admin";

export default defineConfig({
  urbanstay: {
    input: {
      target: API_DOCS_URL,
    },
    output: {
      mode: "tags-split",
      target: "./src/shared/api/generated",
      schemas: "./src/shared/api/generated/schemas",
      client: "react-query",
      httpClient: "axios",
      clean: ["!zod/**"],
      override: {
        mutator: {
          path: "./src/shared/api/http.ts",
          name: "http",
        },
      },
    },
  },
  urbanstayZod: {
    input: {
      target: API_DOCS_URL,
    },
    output: {
      mode: "tags-split",
      target: "./src/shared/api/generated/zod",
      schemas: "./src/shared/api/generated/zod/schemas",
      client: "zod",
      clean: true,
      override: {
        zod: {
          generateReusableSchemas: true,
        },
      },
    },
  },
});
