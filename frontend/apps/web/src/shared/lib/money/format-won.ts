import { COMMON_MESSAGES } from "@/shared/config";

const wonFormat = new Intl.NumberFormat("ko-KR");

export function formatWon(amount: number) {
  return COMMON_MESSAGES.won(wonFormat.format(amount));
}
