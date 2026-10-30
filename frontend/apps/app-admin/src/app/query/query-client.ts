import {
  RequestValidationError,
  ResponseValidationError,
} from "@repo/admin-kit/api";
import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import type { QueryKey } from "@tanstack/react-query";
import { isAxiosError } from "axios";

const MAX_QUERY_RETRY_COUNT = 3;
const CLIENT_ERROR_STATUS = { min: 400, max: 499 } as const;

export type QueryErrorListener = (error: unknown, queryKey?: QueryKey) => void;

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

export function createQueryClient(onError: QueryErrorListener) {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => onError(error, query.queryKey),
    }),
    mutationCache: new MutationCache({
      onError: (error) => onError(error),
    }),
    defaultOptions: {
      queries: {
        retry: shouldRetryQuery,
      },
    },
  });
}
