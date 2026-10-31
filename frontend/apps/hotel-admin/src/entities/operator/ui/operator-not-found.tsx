import { Card } from "@repo/ui/card";
import { ButtonLink } from "@repo/admin-kit/link";
import { COMMON_MESSAGES } from "@/shared/config";
import { OPERATOR_NOT_FOUND_MESSAGES } from "../config/messages";

export function OperatorNotFound() {
  return (
    <Card>
      <div className="flex flex-col items-center gap-4">
        <p role="alert" className="text-sm text-neutral-700">
          {OPERATOR_NOT_FOUND_MESSAGES.description}
        </p>
        <ButtonLink
          to="/operators"
          activeOptions={{ exact: true }}
          variant="secondary"
        >
          {COMMON_MESSAGES.backToList}
        </ButtonLink>
      </div>
    </Card>
  );
}
