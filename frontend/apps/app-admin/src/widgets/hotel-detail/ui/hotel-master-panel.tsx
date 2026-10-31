import { HotelNotFound } from "@/entities/hotel";
import {
  HotelMasterInformation,
  HotelMasterLoadFailed,
  HotelMasterLoading,
  HotelMasterSection,
  useHotelMaster,
} from "@/entities/hotel-master";

type HotelMasterPanelProps = {
  hotelId: number;
};

export function HotelMasterPanel({ hotelId }: HotelMasterPanelProps) {
  const state = useHotelMaster(hotelId);

  switch (state.status) {
    case "notFound":
      return <HotelNotFound />;
    case "loading":
      return (
        <HotelMasterSection>
          <HotelMasterLoading />
        </HotelMasterSection>
      );
    case "failed":
      return (
        <HotelMasterSection>
          <HotelMasterLoadFailed onRetry={state.retry} />
        </HotelMasterSection>
      );
    case "ready":
      return (
        <HotelMasterSection>
          <HotelMasterInformation master={state.master} />
        </HotelMasterSection>
      );
  }
}
