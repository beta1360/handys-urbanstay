import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, RefObject } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  isPeriodOverlapped,
  STAY_VALIDATION_MESSAGES,
  useReservedPeriods,
} from "@/entities/stay";
import { API_ERROR_CODES, getApiError } from "@/shared/api";
import type { ReservedStay, Room } from "@/shared/api";
import {
  showSubmitError,
  SUBMIT_ONLY_VALIDATION,
  toFieldPropsMap,
} from "@/shared/lib/form";
import type { FormFieldProps } from "@/shared/lib/form";
import { useReserveStay } from "../api/use-reserve-stay";
import {
  createStayReserveFormSchema,
  EMPTY_STAY_RESERVE_VALUES,
  STAY_RESERVE_FIELDS,
} from "./stay-reserve-form-schema";
import type { StayReserveField } from "./stay-reserve-form-schema";

export type Reservation = {
  stay: ReservedStay;
  message: string;
};

export type StayReserveState =
  | {
      status: "editing";
      fields: Record<StayReserveField, FormFieldProps>;
      formAlert: string | undefined;
      isSubmitting: boolean;
      handleSubmit: (event: FormEvent<HTMLFormElement>) => void;
    }
  | {
      status: "completed";
      reservation: Reservation;
      headingRef: RefObject<HTMLHeadingElement | null>;
    };

export function useStayReserve(room: Room): StayReserveState {
  const { reserve } = useReserveStay(room.id);
  const reservedPeriods = useReservedPeriods(room.id);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [reservation, setReservation] = useState<Reservation>();
  const schema = useMemo(
    () => createStayReserveFormSchema(room.capacity),
    [room.capacity],
  );
  const form = useForm({
    ...SUBMIT_ONLY_VALIDATION,
    resolver: zodResolver(schema),
    defaultValues: EMPTY_STAY_RESERVE_VALUES,
  });
  const { formState } = form;
  const fields = toFieldPropsMap(form, STAY_RESERVE_FIELDS);
  const isSubmitting = formState.isSubmitting || formState.isSubmitSuccessful;

  useEffect(() => {
    if (reservation !== undefined) {
      headingRef.current?.focus();
    }
  }, [reservation]);

  const submit = form.handleSubmit((values) => {
    if (
      reservedPeriods.status === "ready" &&
      isPeriodOverlapped(values, reservedPeriods.periods)
    ) {
      form.setError(
        "checkInDate",
        { type: "overlap", message: STAY_VALIDATION_MESSAGES.periodOverlapped },
        { shouldFocus: true },
      );
      return;
    }
    return new Promise<void>((resolve) => {
      reserve(
        { roomId: room.id, ...values },
        {
          onSuccess: ({ data, message }) => {
            setReservation({ stay: data, message });
            resolve();
          },
          onError: (error) => {
            showSubmitError(getApiError(error), {
              fields: STAY_RESERVE_FIELDS,
              setError: form.setError,
              fieldOfCode: {
                [API_ERROR_CODES.stayPeriodOverlapped]: "checkInDate",
              },
            });
            resolve();
          },
        },
      );
    });
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (isSubmitting) {
      event.preventDefault();
      return;
    }
    void submit(event);
  }

  if (reservation !== undefined) {
    return { status: "completed", reservation, headingRef };
  }
  return {
    status: "editing",
    fields,
    formAlert: formState.errors.root?.server?.message,
    isSubmitting,
    handleSubmit,
  };
}
