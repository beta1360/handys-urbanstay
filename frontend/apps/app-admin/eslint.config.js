import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import pluginRouter from "@tanstack/eslint-plugin-router";
import { defineConfig, globalIgnores } from "eslint/config";

const GENERATED_IMPORT_PATTERN = {
  regex: "(^|/)api/generated(/|$)",
  message:
    "생성 코드(shared/api/generated)는 shared/api 밖에서 가져오지 않는다. 검증된 API를 @/shared/api에서 가져온다.",
};

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

function restrictImports({ paths = [], patterns = [] }) {
  return { "no-restricted-imports": ["error", { paths, patterns }] };
}

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
    ignores: ["src/shared/api/**", ...REACT_QUERY_ALLOWED_FILES],
    rules: restrictImports({
      paths: [REACT_QUERY_IMPORT_PATH],
      patterns: [GENERATED_IMPORT_PATTERN],
    }),
  },
  {
    files: REACT_QUERY_ALLOWED_FILES,
    ignores: ["src/shared/api/**"],
    rules: restrictImports({ patterns: [GENERATED_IMPORT_PATTERN] }),
  },
  {
    files: ["src/shared/api/**/*.{ts,tsx}"],
    ignores: ["src/shared/api/generated/**", "**/*.test.{ts,tsx}"],
    rules: restrictImports({ paths: [REACT_QUERY_IMPORT_PATH] }),
  },
]);
