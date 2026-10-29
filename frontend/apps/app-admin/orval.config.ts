import { defineConfig } from "orval";

export default defineConfig({
  urbanstay: {
    input: {
      target: "http://localhost:8080/v3/api-docs/app-admin",
    },
    output: {
      mode: "tags-split",
      target: "./src/shared/api/generated",
      schemas: "./src/shared/api/generated/schemas",
      client: "react-query",
      httpClient: "axios",
      clean: true,
      override: {
        mutator: {
          path: "./src/shared/api/http.ts",
          name: "http",
        },
      },
    },
  },
});
