const wonFormat = new Intl.NumberFormat("ko-KR");

export function formatWon(amount: number) {
  return `${wonFormat.format(amount)}원`;
}
