import { Table } from "@repo/ui/table";
import type { TableColumn } from "@repo/ui/table";
import { TextLink } from "@repo/admin-kit/link";
import { MEMBER_FIELD_LABELS } from "@/entities/member";
import type { Member } from "@/shared/api";

const MEMBER_COLUMNS: readonly TableColumn<Member>[] = [
  {
    key: "name",
    header: MEMBER_FIELD_LABELS.name,
    cell: (member) => (
      <TextLink to="/members/$memberId" params={{ memberId: member.id }}>
        {member.name}
      </TextLink>
    ),
  },
  {
    key: "email",
    header: MEMBER_FIELD_LABELS.email,
    cell: (member) => member.email,
  },
  {
    key: "phone",
    header: MEMBER_FIELD_LABELS.phone,
    cell: (member) => member.phone,
  },
];

function getMemberKey(member: Member) {
  return member.id;
}

type MemberTableProps = {
  members: readonly Member[];
  isUpdating: boolean;
};

export function MemberTable({ members, isUpdating }: MemberTableProps) {
  return (
    <Table
      columns={MEMBER_COLUMNS}
      rows={members}
      getRowKey={getMemberKey}
      aria-busy={isUpdating || undefined}
    />
  );
}
