import { Card } from "@repo/ui/card";
import { HotelNotFound } from "@/entities/hotel";
import {
  HotelMasterLoadFailed,
  HotelMasterLoading,
  useHotelMaster,
} from "@/entities/hotel-master";
import { HotelMasterUpdateForm } from "./hotel-master-update-form";

type HotelMasterUpdateProps = {
  hotelId: number;
};

export function HotelMasterUpdate({ hotelId }: HotelMasterUpdateProps) {
  const state = useHotelMaster(hotelId);

  switch (state.status) {
    case "ready":
      return (
        <HotelMasterUpdateForm
          key={hotelId}
          hotelId={hotelId}
          initialMaster={state.master}
        />
      );
    case "notFound":
      return <HotelNotFound />;
    case "failed":
      return (
        <Card>
          <HotelMasterLoadFailed onRetry={state.retry} />
        </Card>
      );
    case "loading":
      return (
        <Card>
          <HotelMasterLoading />
        </Card>
      );
  }
}
