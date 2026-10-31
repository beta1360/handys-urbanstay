import { useMutation, useQueryClient } from "@tanstack/react-query";
import { endMemberSession } from "@/entities/member";
import { API_ERROR_CODES, getApiError, logoutMember } from "@/shared/api";

async function logoutIgnoringEndedSession(): Promise<string | undefined> {
  try {
    const { message } = await logoutMember();
    return message;
  } catch (error) {
    if (getApiError(error)?.code !== API_ERROR_CODES.unauthorized) {
      throw error;
    }
    return undefined;
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
