import { Card } from "@repo/ui/card";
import { ButtonLink } from "@repo/admin-kit/link";
import { OPERATOR_ACCESS_MESSAGES } from "../config/messages";

export function OperatorForbidden() {
  return (
    <Card>
      <div className="flex flex-col items-center gap-4">
        <p role="alert" className="text-sm text-neutral-700">
          {OPERATOR_ACCESS_MESSAGES.forbidden}
        </p>
        <ButtonLink to="/rooms" variant="secondary">
          {OPERATOR_ACCESS_MESSAGES.backToRooms}
        </ButtonLink>
      </div>
    </Card>
  );
}
