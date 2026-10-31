const DAY_MILLISECONDS = 24 * 60 * 60 * 1000;

export type StayPeriod = {
  checkInDate: string;
  checkOutDate: string;
};

function toEpochDay(date: string) {
  return Date.parse(date) / DAY_MILLISECONDS;
}

export function countNights({ checkInDate, checkOutDate }: StayPeriod) {
  return toEpochDay(checkOutDate) - toEpochDay(checkInDate);
}
