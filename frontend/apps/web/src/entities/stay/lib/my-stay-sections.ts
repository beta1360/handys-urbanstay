import type { MyStay } from "@/shared/api";

export type MyStaySections = {
  upcoming: MyStay[];
  past: MyStay[];
};

function byNearestCheckIn(a: MyStay, b: MyStay) {
  return a.checkInDate.localeCompare(b.checkInDate) || a.id - b.id;
}

export function splitMyStays(stays: MyStay[], today: string): MyStaySections {
  return {
    upcoming: stays
      .filter(({ checkOutDate }) => checkOutDate > today)
      .sort(byNearestCheckIn),
    past: stays.filter(({ checkOutDate }) => checkOutDate <= today),
  };
}
