import {
  StayCancellationInformation,
  StayInformation,
  StayLoadFailed,
  StayLoading,
  StayNotFound,
  useStay,
} from "@/entities/stay";
import { StayDetailActions } from "./stay-detail-actions";

type StayDetailProps = {
  stayId: number;
};

export function StayDetail({ stayId }: StayDetailProps) {
  const state = useStay(stayId);

  switch (state.status) {
    case "notFound":
      return <StayNotFound />;
    case "loading":
      return (
        <>
          <StayDetailActions />
          <StayLoading />
        </>
      );
    case "failed":
      return (
        <>
          <StayDetailActions />
          <StayLoadFailed onRetry={state.retry} />
        </>
      );
    case "ready":
      return (
        <>
          <StayDetailActions />
          <StayInformation stay={state.stay} />
          {state.stay.cancellation === null ? null : (
            <StayCancellationInformation
              cancellation={state.stay.cancellation}
            />
          )}
        </>
      );
  }
}
