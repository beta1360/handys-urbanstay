import { useQueryClient } from "@tanstack/react-query";
import { startMemberSession } from "@/entities/member";
import { loginMember } from "@/shared/api";
import type { LoginBody } from "@/shared/api";

export function useLogin() {
  const queryClient = useQueryClient();

  async function login(body: LoginBody) {
    const { data } = await loginMember(body);
    startMemberSession(queryClient, data);
  }

  return { login };
}
