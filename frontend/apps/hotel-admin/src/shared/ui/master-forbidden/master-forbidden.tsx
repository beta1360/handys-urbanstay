import { Card } from "@repo/ui/card";
import { ButtonLink } from "@repo/admin-kit/link";
import { ACCESS_MESSAGES } from "@/shared/config";

export function MasterForbidden() {
  return (
    <Card>
      <div className="flex flex-col items-center gap-4">
        <p role="alert" className="text-sm text-neutral-700">
          {ACCESS_MESSAGES.forbidden}
        </p>
        <ButtonLink to="/rooms" variant="secondary">
          {ACCESS_MESSAGES.backToRooms}
        </ButtonLink>
      </div>
    </Card>
  );
}
