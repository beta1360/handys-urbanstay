import { Card } from "@repo/ui/card";
import { ADMIN_LIST_CONTENT_MESSAGES } from "../config/messages";

export function AdminListEmpty() {
  return (
    <Card>
      <p className="text-center text-sm text-neutral-500">
        {ADMIN_LIST_CONTENT_MESSAGES.empty}
      </p>
    </Card>
  );
}
