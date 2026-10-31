import type { Account } from "@/shared/api";

export function isMaster({ role }: Pick<Account, "role">) {
  return role === "MASTER";
}
