import { COMMON_MESSAGES, ROUTES } from "@/shared/config";
import { ButtonLink } from "@/shared/ui";
import { MY_STAY_MESSAGES } from "../config/messages";

export function MyStayListEmpty() {
  return (
    <div className="flex flex-col gap-4 py-8 text-center">
      <p className="text-sm text-gray-500">{MY_STAY_MESSAGES.empty}</p>
      <ButtonLink href={ROUTES.hotels} variant="secondary">
        {COMMON_MESSAGES.backToHotels}
      </ButtonLink>
    </div>
  );
}
