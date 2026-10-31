import type { Account } from "@/shared/api";

export const ACCOUNT_ROLE_LABELS = {
  MASTER: "마스터",
  OPERATOR: "운영자",
} as const satisfies Record<Account["role"], string>;
