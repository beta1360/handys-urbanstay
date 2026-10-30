import { hotelParamsSchema } from "@/shared/api";

const HOTEL_ID_PATTERN = /^\d+$/;

const HOTEL_ID_MIN = 1;

type HotelPathParams = {
  hotelId: number | undefined;
};

function toHotelId(value: string) {
  if (!HOTEL_ID_PATTERN.test(value)) {
    return undefined;
  }
  const hotelId = Number(value);
  return hotelId >= HOTEL_ID_MIN &&
    hotelParamsSchema.safeParse({ hotelId }).success
    ? hotelId
    : undefined;
}

// 오류를 던지면 루트 오류 화면으로 가므로 잘못된 id는 undefined로 바꿔 찾을 수 없음을 보여준다.
export function parseHotelPathParams(params: {
  hotelId: string;
}): HotelPathParams {
  return { hotelId: toHotelId(params.hotelId) };
}

export function stringifyHotelPathParams({ hotelId }: HotelPathParams) {
  return { hotelId: String(hotelId) };
}
