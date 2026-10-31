import { Card } from "@repo/ui/card";
import {
  DescriptionList,
  DescriptionListItem,
} from "@repo/ui/description-list";
import type { Admin } from "@/shared/api";
import { ADMIN_FIELD_LABELS } from "../config/messages";
import { AdminCreatedDate } from "./admin-created-date";

type AdminInformationProps = {
  admin: Admin;
};

export function AdminInformation({ admin }: AdminInformationProps) {
  return (
    <Card>
      <DescriptionList>
        <DescriptionListItem term={ADMIN_FIELD_LABELS.name}>
          {admin.name}
        </DescriptionListItem>
        <DescriptionListItem term={ADMIN_FIELD_LABELS.loginId}>
          {admin.loginId}
        </DescriptionListItem>
        <DescriptionListItem term={ADMIN_FIELD_LABELS.createdAt}>
          <AdminCreatedDate createdAt={admin.createdAt} />
        </DescriptionListItem>
      </DescriptionList>
    </Card>
  );
}
