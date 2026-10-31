import {
  COMMON_API_ERROR_CODES,
  createApiErrorReader,
} from "@repo/admin-kit/api";
import { ErrorApiResponse } from "./generated/zod/schemas";

export const API_ERROR_CODES = {
  ...COMMON_API_ERROR_CODES,
} as const;

export const getApiError = createApiErrorReader(ErrorApiResponse);
