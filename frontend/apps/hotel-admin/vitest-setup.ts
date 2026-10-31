import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import { afterEach } from "vitest";

const ASYNC_UTIL_TIMEOUT_MS = 3_000;

configure({ asyncUtilTimeout: ASYNC_UTIL_TIMEOUT_MS });

window.scrollTo = () => {};

afterEach(() => {
  cleanup();
});
