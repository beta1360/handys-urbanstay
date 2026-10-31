import { HOTEL_LIST_MESSAGES } from "../config/messages";

export function HotelListEmpty() {
  return (
    <p className="py-8 text-center text-sm text-gray-500">
      {HOTEL_LIST_MESSAGES.empty}
    </p>
  );
}
