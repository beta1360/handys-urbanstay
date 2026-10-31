import {
  DescriptionList,
  DescriptionListItem,
} from "@repo/ui/description-list";
import type { HotelMaster } from "@/shared/api";
import { HOTEL_MASTER_FIELD_LABELS } from "../config/messages";

type HotelMasterInformationProps = {
  master: HotelMaster;
};

export function HotelMasterInformation({
  master,
}: HotelMasterInformationProps) {
  return (
    <DescriptionList>
      <DescriptionListItem term={HOTEL_MASTER_FIELD_LABELS.name}>
        {master.name}
      </DescriptionListItem>
      <DescriptionListItem term={HOTEL_MASTER_FIELD_LABELS.loginId}>
        {master.loginId}
      </DescriptionListItem>
    </DescriptionList>
  );
}
