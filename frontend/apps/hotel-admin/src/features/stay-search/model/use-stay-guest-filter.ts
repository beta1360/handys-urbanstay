import {
  GUEST_LOAD_MESSAGES,
  GUEST_NOT_FOUND_MESSAGES,
  useGuest,
} from "@/entities/guest";
import { COMMON_MESSAGES } from "@/shared/config";
import { STAY_SEARCH_FORM_MESSAGES } from "../config/messages";

export function useStayGuestFilter(guestId: number) {
  const state = useGuest(guestId);

  switch (state.status) {
    case "loading":
      return COMMON_MESSAGES.loading;
    case "notFound":
      return GUEST_NOT_FOUND_MESSAGES.description;
    case "failed":
      return GUEST_LOAD_MESSAGES.loadFailed;
    case "ready":
      return STAY_SEARCH_FORM_MESSAGES.guestFilterValue(
        state.guest.name,
        state.guest.phone,
      );
  }
}
