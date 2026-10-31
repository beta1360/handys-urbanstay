const koreanDateFormat = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function formatKoreanDate(isoDateTime: string) {
  const parts = Object.fromEntries(
    koreanDateFormat
      .formatToParts(new Date(isoDateTime))
      .map(({ type, value }) => [type, value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}
