import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import pluginRouter from "@tanstack/eslint-plugin-router";
import { defineConfig, globalIgnores } from "eslint/config";

const REACT_QUERY_IMPORT_PATH = {
  name: "@tanstack/react-query",
  message:
    "TanStack Query는 entities·features의 api 세그먼트와 app 레이어에서만 가져온다. 그 밖에서는 entities·features의 조회·변경 훅과 캐시 규칙 함수를 쓴다.",
};

const REACT_QUERY_ALLOWED_FILES = [
  "src/app/**",
  "src/entities/*/api/**",
  "src/features/*/api/**",
  "**/*.test.{ts,tsx}",
  "vitest-setup.ts",
];

export default defineConfig([
  globalIgnores(["dist"]),
  ...pluginRouter.configs["flat/recommended"],
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    ignores: REACT_QUERY_ALLOWED_FILES,
    rules: {
      "no-restricted-imports": ["error", { paths: [REACT_QUERY_IMPORT_PATH] }],
    },
  },
]);
