import { useEffect, useRef, useState } from "react";
import type { FormEvent, RefObject } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRoomTypes } from "@/entities/room-type";
import { useStayCriteria } from "@/entities/stay";
import type { StayCriteria } from "@/entities/stay";
import { getApiError } from "@/shared/api";
import type { ReservedStay, RoomType } from "@/shared/api";
import {
  showSubmitError,
  SUBMIT_ONLY_VALIDATION,
  toFieldPropsMap,
} from "@/shared/lib/form";
import type { FormFieldProps } from "@/shared/lib/form";
import { useReserveStay } from "../api/use-reserve-stay";
import {
  EMPTY_STAY_RESERVE_VALUES,
  STAY_RESERVE_FIELDS,
  stayReserveFormSchema,
} from "./stay-reserve-form-schema";
import type { StayReserveField } from "./stay-reserve-form-schema";

export type Reservation = {
  stay: ReservedStay;
  message: string;
};

export type ReservationSummary = {
  roomType: RoomType;
  criteria: StayCriteria;
};

export type StayReserveState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "failed"; retry: () => void }
  | { status: "empty" }
  | {
      status: "ready";
      roomTypes: RoomType[];
      fields: Record<StayReserveField, FormFieldProps>;
      summary: ReservationSummary | undefined;
      formAlert: string | undefined;
      isSubmitting: boolean;
      handleSubmit: (event: FormEvent<HTMLFormElement>) => void;
    }
  | {
      status: "completed";
      reservation: Reservation;
      headingRef: RefObject<HTMLHeadingElement | null>;
    };

export function useStayReserve(hotelId: number): StayReserveState {
  const criteria = useStayCriteria();
  const roomTypes = useRoomTypes(hotelId, criteria);
  const { reserve } = useReserveStay(hotelId);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [reservation, setReservation] = useState<Reservation>();
  const form = useForm({
    ...SUBMIT_ONLY_VALIDATION,
    resolver: zodResolver(stayReserveFormSchema),
    defaultValues: EMPTY_STAY_RESERVE_VALUES,
  });
  const { formState } = form;
  const fields = toFieldPropsMap(form, STAY_RESERVE_FIELDS);
  const isSubmitting = formState.isSubmitting || formState.isSubmitSuccessful;
  const selectedType = useWatch({ control: form.control, name: "roomType" });
  const selectedRoomType =
    roomTypes.status === "ready"
      ? roomTypes.roomTypes.find(
          ({ type, availableCount }) =>
            type === selectedType && availableCount > 0,
        )
      : undefined;
  const summary =
    criteria !== undefined && selectedRoomType !== undefined
      ? { roomType: selectedRoomType, criteria }
      : undefined;

  useEffect(() => {
    form.resetField("roomType");
    form.clearErrors();
  }, [criteria, form]);

  useEffect(() => {
    if (reservation !== undefined) {
      headingRef.current?.focus();
    }
  }, [reservation]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (isSubmitting || summary === undefined) {
      event.preventDefault();
      return;
    }
    const { criteria: period } = summary;
    void form.handleSubmit(
      ({ roomType, guest }) =>
        new Promise<void>((resolve) => {
          reserve(
            { hotelId, roomType, ...period, guest },
            {
              onSuccess: ({ data, message }) => {
                setReservation({ stay: data, message });
                resolve();
              },
              onError: (error) => {
                showSubmitError(getApiError(error), {
                  fields: STAY_RESERVE_FIELDS,
                  setError: form.setError,
                });
                resolve();
              },
            },
          );
        }),
    )(event);
  }

  if (reservation !== undefined) {
    return { status: "completed", reservation, headingRef };
  }
  if (roomTypes.status !== "ready") {
    return roomTypes;
  }
  return {
    status: "ready",
    roomTypes: roomTypes.roomTypes,
    fields,
    summary,
    formAlert: formState.errors.root?.server?.message,
    isSubmitting,
    handleSubmit,
  };
}
