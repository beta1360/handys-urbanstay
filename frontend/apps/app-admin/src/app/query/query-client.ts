import { QueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { RequestValidationError, ResponseValidationError } from "@/shared/api";

const MAX_QUERY_RETRY_COUNT = 3;
const CLIENT_ERROR_STATUS = { min: 400, max: 499 } as const;

function isClientError(error: unknown) {
  if (!isAxiosError(error) || error.response === undefined) {
    return false;
  }
  const { status } = error.response;
  return status >= CLIENT_ERROR_STATUS.min && status <= CLIENT_ERROR_STATUS.max;
}

function shouldRetryQuery(failureCount: number, error: unknown) {
  if (
    error instanceof RequestValidationError ||
    error instanceof ResponseValidationError ||
    isClientError(error)
  ) {
    return false;
  }
  return failureCount < MAX_QUERY_RETRY_COUNT;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: shouldRetryQuery,
    },
  },
});
