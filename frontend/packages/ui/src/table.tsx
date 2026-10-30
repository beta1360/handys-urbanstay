import type { ComponentProps, Key, ReactNode } from "react";
import { joinClassNames } from "./class-names";

export type TableColumn<Row> = {
  key: string;
  header: ReactNode;
  cell: (row: Row) => ReactNode;
};

type TableProps<Row> = Omit<ComponentProps<"table">, "children"> & {
  columns: readonly TableColumn<Row>[];
  rows: readonly Row[];
  getRowKey: (row: Row) => Key;
};

export function Table<Row>({
  columns,
  rows,
  getRowKey,
  className,
  ...props
}: TableProps<Row>) {
  return (
    <div
      className={joinClassNames(
        "overflow-x-auto rounded-lg border border-neutral-200 bg-white",
        className,
      )}
    >
      <table
        {...props}
        className="w-full text-left text-sm transition-opacity aria-busy:opacity-60"
      >
        <thead className="border-b border-neutral-200 bg-neutral-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className="px-4 py-3 font-medium text-neutral-600"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200">
          {rows.map((row) => (
            <tr key={getRowKey(row)}>
              {columns.map((column) => (
                <td key={column.key} className="px-4 py-3 text-neutral-900">
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
