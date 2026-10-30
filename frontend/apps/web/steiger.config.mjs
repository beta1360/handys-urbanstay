import { defineConfig } from "steiger";
import fsd from "@feature-sliced/steiger-plugin";

export default defineConfig([
  ...fsd.configs.recommended,
  {
    rules: { "fsd/insignificant-slice": "off" },
  },
  {
    files: ["./src/_app/**", "./src/_pages/**"],
    rules: { "fsd/typo-in-layer-name": "off" },
  },
]);
