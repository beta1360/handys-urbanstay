"use client";

import type { ReactNode } from "react";
import type { Room } from "@/shared/api";
import { useStayReserve } from "../model/use-stay-reserve";
import { StayReserveCompleted } from "./stay-reserve-completed";
import { StayReserveFormView } from "./stay-reserve-form-view";

type StayReserveProps = {
  room: Room;
  children: ReactNode;
};

export function StayReserve({ room, children }: StayReserveProps) {
  const state = useStayReserve(room);

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
      <StayReserveFormView
        capacity={room.capacity}
        fields={state.fields}
        formAlert={state.formAlert}
        isSubmitting={state.isSubmitting}
        onSubmit={state.handleSubmit}
      />
    </>
  );
}
