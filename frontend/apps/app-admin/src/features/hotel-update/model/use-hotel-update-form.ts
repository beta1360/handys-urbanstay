import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { flushSync } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import {
  HOTEL_INFO_FIELDS,
  HOTEL_LOAD_MESSAGES,
  useRefetchHotel,
} from "@/entities/hotel";
import { API_ERROR_CODES, getApiError } from "@/shared/api";
import type { Hotel } from "@/shared/api";
import {
  FORM_ALERT,
  showSubmitError,
  SUBMIT_ONLY_VALIDATION,
  toFieldPropsMap,
  useFormErrorToast,
} from "@/shared/lib/form";
import type { FormAlert } from "@/shared/lib/form";
import { showToast } from "@/shared/lib/toast";
import { useUpdateHotel } from "../api/use-update-hotel";
import {
  hotelUpdateFormSchema,
  toHotelUpdateFormValues,
} from "./hotel-update-form-schema";

export type HotelUpdateStatus =
  | "editing"
  | "submitting"
  | "reloading"
  | "notFound";

type LoadState = "idle" | "reloading" | "notFound";

const RELOAD_FAILED = "RELOAD_FAILED";

export function useHotelUpdateForm(hotelId: number, initialHotel: Hotel) {
  const { update } = useUpdateHotel(hotelId);
  const refetchHotel = useRefetchHotel(hotelId);
  const navigate = useNavigate();
  const errorToast = useFormErrorToast();
  const reloadButtonRef = useRef<HTMLButtonElement>(null);
  // 다시 조회된 값으로 입력 중인 폼을 덮지 않도록 처음 받은 값으로만 채운다.
  const form = useForm({
    ...SUBMIT_ONLY_VALIDATION,
    resolver: zodResolver(hotelUpdateFormSchema),
    defaultValues: toHotelUpdateFormValues(initialHotel),
  });
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const { formState } = form;
  const fields = toFieldPropsMap(form, HOTEL_INFO_FIELDS);
  const formAlert = formState.errors.root?.server;
  const alert =
    formAlert?.type === API_ERROR_CODES.hotelModified ||
    formAlert?.type === RELOAD_FAILED
      ? formAlert.message
      : undefined;
  const isSubmitting = formState.isSubmitting || formState.isSubmitSuccessful;
  const status: HotelUpdateStatus =
    loadState !== "idle" ? loadState : isSubmitting ? "submitting" : "editing";

  function toastFormAlert({ code, message }: FormAlert) {
    if (code !== API_ERROR_CODES.hotelModified) {
      errorToast.show(message);
    }
  }

  const submit = form.handleSubmit(
    (body) =>
      new Promise<void>((resolve) => {
        // 화면을 떠난 뒤 끝난 요청은 이동하지 않도록 이동은 mutate 콜백에, 캐시 갱신은 useMutation 콜백에 둔다.
        update(body, {
          onSuccess: ({ data: hotel, message }) => {
            showToast({ type: "success", message });
            void navigate({
              to: "/hotels/$hotelId",
              params: { hotelId: hotel.id },
              replace: true,
            });
            resolve();
          },
          onError: (error) => {
            showSubmitError(error, {
              fields: HOTEL_INFO_FIELDS,
              setError: form.setError,
              onAlert: toastFormAlert,
            });
            resolve();
          },
        });
      }),
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (status !== "editing") {
      event.preventDefault();
      return;
    }
    errorToast.dismiss();
    void submit(event);
  }

  async function reload() {
    if (status !== "editing") {
      return;
    }
    setLoadState("reloading");
    try {
      const hotel = await refetchHotel();
      form.reset(toHotelUpdateFormValues(hotel), { keepFieldsRef: true });
      setLoadState("idle");
      form.setFocus(HOTEL_INFO_FIELDS[0]);
    } catch (error) {
      if (getApiError(error)?.code === API_ERROR_CODES.hotelNotFound) {
        setLoadState("notFound");
        return;
      }
      // 다시 누를 수 있게 된 버튼을 그린 뒤 그 버튼에 초점을 돌린다.
      flushSync(() => {
        form.setError(FORM_ALERT, {
          type: RELOAD_FAILED,
          message: HOTEL_LOAD_MESSAGES.loadFailed,
        });
        setLoadState("idle");
      });
      reloadButtonRef.current?.focus();
    }
  }

  return {
    fields,
    alert,
    status,
    reloadButtonRef,
    handleSubmit,
    reload: () => void reload(),
  };
}
