const WON_NUMBER_FORMAT = new Intl.NumberFormat("ko-KR");

export function formatWon(amount: number) {
  return `${WON_NUMBER_FORMAT.format(amount)}원`;
}
