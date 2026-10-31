import { useQueryClient } from "@tanstack/react-query";
import { startMemberSession } from "@/entities/member";
import { signupMember } from "@/shared/api";
import type { SignupBody } from "@/shared/api";

export function useSignup() {
  const queryClient = useQueryClient();

  async function signup(body: SignupBody) {
    const { data } = await signupMember(body);
    startMemberSession(queryClient, data);
  }

  return { signup };
}
