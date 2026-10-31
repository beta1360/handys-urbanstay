import { environmentManager, QueryClient } from "@tanstack/react-query";
import {
  ApiResponseError,
  RequestValidationError,
  ResponseValidationError,
} from "@/shared/api";

const DEFAULT_STALE_TIME_MS = 60 * 1000;

const MAX_QUERY_RETRY_COUNT = 3;

const CLIENT_ERROR_STATUS = { min: 400, max: 499 } as const;

let browserQueryClient: QueryClient | undefined = undefined;

function isClientError(error: unknown) {
  return (
    error instanceof ApiResponseError &&
    error.status >= CLIENT_ERROR_STATUS.min &&
    error.status <= CLIENT_ERROR_STATUS.max
  );
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

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: DEFAULT_STALE_TIME_MS,
        retry: shouldRetryQuery,
      },
    },
  });
}

export function getQueryClient() {
  if (environmentManager.isServer()) {
    return makeQueryClient();
  }

  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }

  return browserQueryClient;
}
