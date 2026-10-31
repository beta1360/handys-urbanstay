import { API_ERROR_CODES, getApiError } from "@/shared/api";
import type { Operator } from "@/shared/api";
import { useOperatorQuery } from "../api/operator-query";

export type OperatorState =
  | { status: "loading" }
  | { status: "failed"; retry: () => void }
  | { status: "notFound" }
  | { status: "ready"; operator: Operator };

export function useOperator(operatorId: number): OperatorState {
  const { data, error, refetch } = useOperatorQuery(operatorId);

  if (data !== undefined) {
    return { status: "ready", operator: data };
  }
  if (error === null) {
    return { status: "loading" };
  }
  if (getApiError(error)?.code === API_ERROR_CODES.operatorNotFound) {
    return { status: "notFound" };
  }
  return { status: "failed", retry: () => void refetch() };
}
