import { TextLink } from "@repo/admin-kit/link";
import { STAY_LINK_MESSAGES } from "../config/messages";

type StayListLinkProps = {
  roomId?: number;
  guestId?: number;
};

export function StayListLink({ roomId, guestId }: StayListLinkProps) {
  return (
    <TextLink to="/stays" search={{ roomId, guestId }} className="text-sm">
      {STAY_LINK_MESSAGES.stays}
    </TextLink>
  );
}
