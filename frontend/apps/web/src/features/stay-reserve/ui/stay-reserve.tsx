"use client";

import type { ReactNode } from "react";
import { RoomTypesEmpty, RoomTypesLoadFailed } from "@/entities/room-type";
import { LoadingMessage } from "@/shared/ui";
import { useStayReserve } from "../model/use-stay-reserve";
import { StayReserveCompleted } from "./stay-reserve-completed";
import { StayReserveFormView } from "./stay-reserve-form-view";

type StayReserveProps = {
  hotelId: number;
  children: ReactNode;
};

export function StayReserve({ hotelId, children }: StayReserveProps) {
  const state = useStayReserve(hotelId);

  if (state.status === "completed") {
    return (
      <StayReserveCompleted
        reservation={state.reservation}
        headingRef={state.headingRef}
      />
    );
  }
  return (
    <>
      {children}
      {state.status === "loading" ? <LoadingMessage /> : null}
      {state.status === "failed" ? (
        <RoomTypesLoadFailed onRetry={state.retry} />
      ) : null}
      {state.status === "empty" ? <RoomTypesEmpty /> : null}
      {state.status === "ready" ? (
        <StayReserveFormView
          roomTypes={state.roomTypes}
          fields={state.fields}
          summary={state.summary}
          formAlert={state.formAlert}
          isSubmitting={state.isSubmitting}
          onSubmit={state.handleSubmit}
        />
      ) : null}
    </>
  );
}
