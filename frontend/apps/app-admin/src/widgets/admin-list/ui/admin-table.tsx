import { Table } from "@repo/ui/table";
import type { TableColumn } from "@repo/ui/table";
import { TextLink } from "@repo/admin-kit/link";
import { ADMIN_FIELD_LABELS, AdminCreatedDate } from "@/entities/admin";
import type { AdminSummary } from "@/shared/api";

const ADMIN_COLUMNS: readonly TableColumn<AdminSummary>[] = [
  {
    key: "name",
    header: ADMIN_FIELD_LABELS.name,
    cell: (admin) => (
      <TextLink to="/admins/$adminId" params={{ adminId: admin.id }}>
        {admin.name}
      </TextLink>
    ),
  },
  {
    key: "loginId",
    header: ADMIN_FIELD_LABELS.loginId,
    cell: (admin) => admin.loginId,
  },
  {
    key: "createdAt",
    header: ADMIN_FIELD_LABELS.createdAt,
    cell: (admin) => <AdminCreatedDate createdAt={admin.createdAt} />,
  },
];

function getAdminKey(admin: AdminSummary) {
  return admin.id;
}

type AdminTableProps = {
  admins: readonly AdminSummary[];
  isUpdating: boolean;
};

export function AdminTable({ admins, isUpdating }: AdminTableProps) {
  return (
    <Table
      columns={ADMIN_COLUMNS}
      rows={admins}
      getRowKey={getAdminKey}
      aria-busy={isUpdating || undefined}
    />
  );
}
