import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { flushSync } from "react-dom";
import { useNavigate } from "@tanstack/react-router";
import { HOTEL_LOAD_MESSAGES, useRefetchHotel } from "@/entities/hotel";
import { HOTEL_INFO_FIELDS } from "@/features/hotel-info-form";
import type { HotelInfoField } from "@/features/hotel-info-form";
import { useUpdateHotel } from "@/features/hotel-update";
import { API_ERROR_CODES, getApiError } from "@/shared/api";
import type { Hotel } from "@/shared/api";
import {
  focusFirstInvalidField,
  hasFieldError,
  toFieldErrors,
  toIssueFieldMessages,
} from "@/shared/lib/form";
import type { FieldErrors } from "@/shared/lib/form";
import { HOTEL_EDIT_MESSAGES } from "../config/messages";
import {
  hotelEditFormSchema,
  toHotelEditFormState,
} from "./hotel-edit-form-schema";

type HotelEditStatus = "editing" | "submitting" | "reloading" | "notFound";

type HotelEditFormError = {
  message: string;
  canReload: boolean;
};

export function useHotelEditForm(hotelId: number, initialHotel: Hotel) {
  const { update } = useUpdateHotel(hotelId);
  const refetchHotel = useRefetchHotel(hotelId);
  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement>(null);
  const reloadButtonRef = useRef<HTMLButtonElement>(null);
  // 다시 조회된 값으로 입력 중인 폼을 덮지 않도록 처음 받은 값으로만 채운다.
  const [form, setForm] = useState(() => toHotelEditFormState(initialHotel));
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<HotelInfoField>>(
    {},
  );
  const [formError, setFormError] = useState<HotelEditFormError>();
  const [status, setStatus] = useState<HotelEditStatus>("editing");

  function changeField(field: HotelInfoField, value: string) {
    setForm((current) => ({
      ...current,
      values: { ...current.values, [field]: value },
    }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  }

  function showFieldErrors(errors: FieldErrors<HotelInfoField>) {
    setFieldErrors(errors);
    focusFirstInvalidField(formRef.current, HOTEL_INFO_FIELDS, errors);
  }

  function focusFirstField() {
    const input = formRef.current?.elements.namedItem(HOTEL_INFO_FIELDS[0]);
    if (input instanceof HTMLElement) {
      input.focus();
    }
  }

  function showSubmitError(error: unknown) {
    const apiError = getApiError(error);
    if (apiError === undefined) {
      setFormError({
        message: HOTEL_EDIT_MESSAGES.requestFailed,
        canReload: false,
      });
      return;
    }
    const errors = toFieldErrors(HOTEL_INFO_FIELDS, apiError.fieldErrors);
    if (hasFieldError(HOTEL_INFO_FIELDS, errors)) {
      showFieldErrors(errors);
      return;
    }
    setFormError({
      message: apiError.message,
      canReload: apiError.code === API_ERROR_CODES.hotelModified,
    });
  }

  async function reload() {
    if (status !== "editing") {
      return;
    }
    setStatus("reloading");
    try {
      const hotel = await refetchHotel();
      setForm(toHotelEditFormState(hotel));
      setFieldErrors({});
      setFormError(undefined);
      setStatus("editing");
      focusFirstField();
    } catch (error) {
      if (getApiError(error)?.code === API_ERROR_CODES.hotelNotFound) {
        setStatus("notFound");
        return;
      }
      // 다시 누를 수 있게 된 버튼을 그린 뒤 그 버튼에 초점을 돌린다.
      flushSync(() => {
        setFormError({
          message: HOTEL_LOAD_MESSAGES.loadFailed,
          canReload: true,
        });
        setStatus("editing");
      });
      reloadButtonRef.current?.focus();
    }
  }

  function goToHotel(hotel: Hotel) {
    void navigate({
      to: "/hotels/$hotelId",
      params: { hotelId: hotel.id },
      replace: true,
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status !== "editing") {
      return;
    }
    setFormError(undefined);
    const result = hotelEditFormSchema.safeParse({
      ...form.values,
      version: form.version,
    });
    if (!result.success) {
      showFieldErrors(
        toFieldErrors(HOTEL_INFO_FIELDS, toIssueFieldMessages(result.error)),
      );
      return;
    }
    setFieldErrors({});
    setStatus("submitting");
    // 화면을 떠난 뒤 끝난 요청은 이동하지 않도록 이동은 mutate 콜백에, 캐시 갱신은 useMutation 콜백에 둔다.
    update(result.data, {
      onSuccess: goToHotel,
      onError: (error) => {
        setStatus("editing");
        showSubmitError(error);
      },
    });
  }

  return {
    formRef,
    reloadButtonRef,
    values: form.values,
    fieldErrors,
    formError,
    status,
    changeField,
    handleSubmit,
    reload: () => void reload(),
    cancel: () =>
      void navigate({ to: "/hotels/$hotelId", params: { hotelId } }),
  };
}
