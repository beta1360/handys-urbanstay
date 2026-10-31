import { useMutation, useQueryClient } from "@tanstack/react-query";
import { endMemberSession } from "@/entities/member";
import { API_ERROR_CODES, getApiError, logoutMember } from "@/shared/api";

async function logoutIgnoringEndedSession() {
  try {
    await logoutMember();
  } catch (error) {
    if (getApiError(error)?.code !== API_ERROR_CODES.unauthorized) {
      throw error;
    }
  }
}

export function useLogout() {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: logoutIgnoringEndedSession,
    onSuccess: () => endMemberSession(queryClient),
  });

  return { logout: mutate, isPending };
}
