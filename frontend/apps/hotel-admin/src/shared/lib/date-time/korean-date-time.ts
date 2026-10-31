const KOREA_TIME_ZONE = "Asia/Seoul";

const koreanDateTimeFormat = new Intl.DateTimeFormat("ko-KR", {
  timeZone: KOREA_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function formatKoreanDateTime(isoDateTime: string) {
  const parts = Object.fromEntries(
    koreanDateTimeFormat
      .formatToParts(new Date(isoDateTime))
      .map(({ type, value }) => [type, value]),
  );
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
}
