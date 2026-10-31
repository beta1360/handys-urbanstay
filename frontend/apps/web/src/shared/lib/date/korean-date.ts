const KOREA_TIME_ZONE = "Asia/Seoul";

const koreanDateFormat = new Intl.DateTimeFormat("ko-KR", {
  timeZone: KOREA_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function getKoreanToday() {
  const parts = Object.fromEntries(
    koreanDateFormat
      .formatToParts(new Date())
      .map(({ type, value }) => [type, value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}
