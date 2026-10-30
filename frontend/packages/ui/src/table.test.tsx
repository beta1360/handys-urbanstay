import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Table } from "./table";
import type { TableColumn } from "./table";

type Room = { id: number; name: string; floor: number };

const ROOMS: Room[] = [
  { id: 1, name: "101", floor: 1 },
  { id: 2, name: "스위트 A", floor: 12 },
];

const COLUMNS: TableColumn<Room>[] = [
  { key: "name", header: "이름", cell: (room) => room.name },
  {
    key: "floor",
    header: "층",
    cell: (room) => <strong>{room.floor}층</strong>,
  },
];

type RenderTableProps = { className?: string; "aria-busy"?: boolean };

function renderTable(props: RenderTableProps = {}) {
  render(
    <Table
      {...props}
      aria-label="객실 목록"
      columns={COLUMNS}
      rows={ROOMS}
      getRowKey={(room) => room.id}
    />,
  );
  return screen.getByRole("table", { name: "객실 목록" });
}

describe("Table", () => {
  it("열 머리글을 열 순서대로 보여준다", () => {
    const table = renderTable();

    const headers = within(table).getAllByRole("columnheader");
    expect(headers.map((header) => header.textContent)).toEqual([
      "이름",
      "층",
    ]);
    expect(headers[0]).toHaveAttribute("scope", "col");
  });

  it("행마다 각 열의 cell로 그린 칸을 보여준다", () => {
    const table = renderTable();

    const [, ...bodyRows] = within(table).getAllByRole("row");
    expect(bodyRows).toHaveLength(ROOMS.length);
    const cells = within(bodyRows[1]).getAllByRole("cell");
    expect(cells[0]).toHaveTextContent("스위트 A");
    expect(within(cells[1]).getByText("12층").tagName).toBe("STRONG");
  });

  it("aria-busy면 표를 흐리게 보여준다", () => {
    const table = renderTable({ "aria-busy": true });

    expect(table).toHaveAttribute("aria-busy", "true");
    expect(table).toHaveClass("aria-busy:opacity-60");
  });

  it("className은 표를 감싼 상자에 덧붙인다", () => {
    const table = renderTable({ className: "mt-4" });

    expect(table.parentElement).toHaveClass("mt-4", "border-neutral-200");
    expect(table).not.toHaveClass("mt-4");
  });
});
