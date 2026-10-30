import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import { reactRefresh } from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

const REACT_QUERY_IMPORT_PATH = {
  name: "@tanstack/react-query",
  message:
    "공통 패키지는 TanStack Query를 쓰지 않는다. 조회·변경 훅과 캐시 규칙은 각 앱의 entities·features api 세그먼트에 둔다.",
};

export default defineConfig([
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite({ extraHOCs: ["createLink"] }),
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      "no-restricted-imports": ["error", { paths: [REACT_QUERY_IMPORT_PATH] }],
    },
  },
]);
