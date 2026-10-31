import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const GENERATED_IMPORT_PATTERN = {
  regex: "(^|/)api/generated(/|$)",
  message:
    "생성 코드(shared/api/generated)는 shared/api 밖에서 가져오지 않는다. 검증된 API를 @/shared/api에서 가져온다.",
};

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

function restrictImports({ paths = [], patterns = [] }) {
  return { "no-restricted-imports": ["error", { paths, patterns }] };
}

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
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
