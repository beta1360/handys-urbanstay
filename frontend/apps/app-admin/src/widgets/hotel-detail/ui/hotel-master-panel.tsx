import { ButtonLink } from "@repo/admin-kit/link";
import { HotelNotFound } from "@/entities/hotel";
import {
  HOTEL_MASTER_INFO_MESSAGES,
  HotelMasterInformation,
  HotelMasterLoadFailed,
  HotelMasterLoading,
  HotelMasterSection,
  useHotelMaster,
} from "@/entities/hotel-master";
import { HotelMasterPasswordReset } from "@/features/hotel-master-password-reset";

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
        <HotelMasterSection
          action={
            <ButtonLink
              to="/hotels/$hotelId/master/edit"
              params={{ hotelId }}
              variant="secondary"
            >
              {HOTEL_MASTER_INFO_MESSAGES.edit}
            </ButtonLink>
          }
        >
          <HotelMasterInformation master={state.master} />
          <HotelMasterPasswordReset key={hotelId} hotelId={hotelId} />
        </HotelMasterSection>
      );
  }
}
