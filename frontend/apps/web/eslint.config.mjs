import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const REACT_QUERY_IMPORT_PATH = {
  name: "@tanstack/react-query",
  message:
    "TanStack Query는 entities·features의 api 세그먼트와 _app 레이어에서만 가져온다. 그 밖에서는 entities·features의 조회·변경 훅과 캐시 규칙 함수를 쓴다.",
};

const REACT_QUERY_ALLOWED_FILES = [
  "src/_app/**",
  "src/entities/*/api/**",
  "src/features/*/api/**",
  "**/*.test.{ts,tsx}",
  "vitest-setup.ts",
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["**/*.{ts,tsx}"],
    ignores: REACT_QUERY_ALLOWED_FILES,
    rules: {
      "no-restricted-imports": ["error", { paths: [REACT_QUERY_IMPORT_PATH] }],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
