import { useQueryClient } from "@tanstack/react-query";
import { startSession } from "@/entities/account";
import { loginAccount } from "@/shared/api";
import type { LoginAccountBody } from "@/shared/api";

export function useLogin() {
  const queryClient = useQueryClient();

  async function login(body: LoginAccountBody) {
    const account = await loginAccount(body);
    startSession(queryClient, account);
  }

  return { login };
}
