import { API_ERROR_CODES, getApiError } from "@/shared/api";
import type { Admin } from "@/shared/api";
import { useAdminQuery } from "../api/admin-query";

export type AdminState =
  | { status: "loading" }
  | { status: "failed"; retry: () => void }
  | { status: "notFound" }
  | { status: "ready"; admin: Admin };

export function useAdmin(adminId: number): AdminState {
  const { data, error, refetch } = useAdminQuery(adminId);

  if (data !== undefined) {
    return { status: "ready", admin: data };
  }
  if (error === null) {
    return { status: "loading" };
  }
  if (getApiError(error)?.code === API_ERROR_CODES.appAdminNotFound) {
    return { status: "notFound" };
  }
  return { status: "failed", retry: () => void refetch() };
}
