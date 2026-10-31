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

function toKoreanParts(date: Date) {
  return Object.fromEntries(
    koreanDateTimeFormat
      .formatToParts(date)
      .map(({ type, value }) => [type, value]),
  );
}

export function formatKoreanDateTime(isoDateTime: string) {
  const parts = toKoreanParts(new Date(isoDateTime));
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
}

export function getKoreanToday() {
  const parts = toKoreanParts(new Date());
  return `${parts.year}-${parts.month}-${parts.day}`;
}
