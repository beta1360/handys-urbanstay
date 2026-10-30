import { Table } from "@repo/ui/table";
import type { TableColumn } from "@repo/ui/table";
import { HOTEL_FIELD_LABELS } from "@/entities/hotel";
import type { Hotel } from "@/shared/api";
import { TextLink } from "@/shared/ui";

const HOTEL_COLUMNS: readonly TableColumn<Hotel>[] = [
  {
    key: "name",
    header: HOTEL_FIELD_LABELS.name,
    cell: (hotel) => (
      <TextLink to="/hotels/$hotelId" params={{ hotelId: hotel.id }}>
        {hotel.name}
      </TextLink>
    ),
  },
  {
    key: "address",
    header: HOTEL_FIELD_LABELS.address,
    cell: (hotel) => hotel.address,
  },
  {
    key: "phone",
    header: HOTEL_FIELD_LABELS.phone,
    cell: (hotel) => hotel.phone,
  },
];

function getHotelKey(hotel: Hotel) {
  return hotel.id;
}

type HotelTableProps = {
  hotels: readonly Hotel[];
  isUpdating: boolean;
};

export function HotelTable({ hotels, isUpdating }: HotelTableProps) {
  return (
    <Table
      columns={HOTEL_COLUMNS}
      rows={hotels}
      getRowKey={getHotelKey}
      aria-busy={isUpdating || undefined}
    />
  );
}
