import type { MyStay } from "@/shared/api";

export type MyStaySections = {
  upcoming: MyStay[];
  past: MyStay[];
};

export function splitMyStays(stays: MyStay[], today: string): MyStaySections {
  return {
    upcoming: stays.filter(({ checkOutDate }) => checkOutDate > today),
    past: stays.filter(({ checkOutDate }) => checkOutDate <= today),
  };
}
