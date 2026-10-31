import { Table } from "@repo/ui/table";
import type { TableColumn } from "@repo/ui/table";
import { TextLink } from "@repo/admin-kit/link";
import {
  OPERATOR_FIELD_LABELS,
  OperatorActiveLabel,
} from "@/entities/operator";
import type { Operator } from "@/shared/api";

const OPERATOR_COLUMNS: readonly TableColumn<Operator>[] = [
  {
    key: "name",
    header: OPERATOR_FIELD_LABELS.name,
    cell: (operator) => (
      <TextLink
        to="/operators/$operatorId"
        params={{ operatorId: operator.id }}
      >
        {operator.name}
      </TextLink>
    ),
  },
  {
    key: "loginId",
    header: OPERATOR_FIELD_LABELS.loginId,
    cell: (operator) => operator.loginId,
  },
  {
    key: "active",
    header: OPERATOR_FIELD_LABELS.active,
    cell: (operator) => <OperatorActiveLabel active={operator.active} />,
  },
];

function getOperatorKey(operator: Operator) {
  return operator.id;
}

type OperatorTableProps = {
  operators: readonly Operator[];
  isUpdating: boolean;
};

export function OperatorTable({ operators, isUpdating }: OperatorTableProps) {
  return (
    <Table
      columns={OPERATOR_COLUMNS}
      rows={operators}
      getRowKey={getOperatorKey}
      aria-busy={isUpdating || undefined}
    />
  );
}
