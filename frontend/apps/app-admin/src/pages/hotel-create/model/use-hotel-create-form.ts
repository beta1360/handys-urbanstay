import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  API_ERROR_CODES,
  createHotel,
  getApiError,
  hotelListQueryKey,
  hotelQueryOptions,
} from "@/shared/api";
import type { Hotel } from "@/shared/api";
import { HOTEL_CREATE_MESSAGES } from "../config/messages";
import {
  EMPTY_HOTEL_CREATE_VALUES,
  HOTEL_CREATE_FIELDS,
  hotelCreateFormSchema,
  toHotelCreateFieldErrors,
  toIssueFieldMessages,
} from "./hotel-create-form-schema";
import type {
  HotelCreateField,
  HotelCreateFieldErrors,
  MasterField,
} from "./hotel-create-form-schema";
import type { HotelInfoField } from "./hotel-info-form";

function hasFieldError(errors: HotelCreateFieldErrors) {
  return HOTEL_CREATE_FIELDS.some((field) => errors[field]);
}

export function useHotelCreateForm() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState(EMPTY_HOTEL_CREATE_VALUES);
  const [fieldErrors, setFieldErrors] = useState<HotelCreateFieldErrors>({});
  const [formError, setFormError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { mutate } = useMutation({
    mutationFn: createHotel,
    onSuccess: (hotel) => {
      void queryClient.invalidateQueries({ queryKey: hotelListQueryKey() });
      queryClient.setQueryData(hotelQueryOptions(hotel.id).queryKey, hotel);
    },
  });

  function clearFieldError(field: HotelCreateField) {
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  }

  function changeHotelInfo(field: HotelInfoField, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    clearFieldError(field);
  }

  function changeMaster(field: MasterField, value: string) {
    setValues((current) => ({
      ...current,
      master: { ...current.master, [field]: value },
    }));
    clearFieldError(`master.${field}`);
  }

  function showFieldErrors(errors: HotelCreateFieldErrors) {
    setFieldErrors(errors);
    const firstInvalidField = HOTEL_CREATE_FIELDS.find((field) => errors[field]);
    if (firstInvalidField === undefined) {
      return;
    }
    const input = formRef.current?.elements.namedItem(firstInvalidField);
    if (input instanceof HTMLElement) {
      input.focus();
    }
  }

  function showSubmitError(error: unknown) {
    const apiError = getApiError(error);
    if (apiError === undefined) {
      setFormError(HOTEL_CREATE_MESSAGES.requestFailed);
      return;
    }
    const errors: HotelCreateFieldErrors =
      apiError.code === API_ERROR_CODES.loginIdDuplicated
        ? { "master.loginId": apiError.message }
        : toHotelCreateFieldErrors(apiError.fieldErrors);
    if (hasFieldError(errors)) {
      showFieldErrors(errors);
      return;
    }
    setFormError(apiError.message);
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
    if (isSubmitting) {
      return;
    }
    setFormError(undefined);
    const result = hotelCreateFormSchema.safeParse(values);
    if (!result.success) {
      showFieldErrors(
        toHotelCreateFieldErrors(toIssueFieldMessages(result.error)),
      );
      return;
    }
    setFieldErrors({});
    setIsSubmitting(true);
    // 화면을 떠난 뒤 끝난 요청은 이동하지 않도록 이동은 mutate 콜백에, 캐시 갱신은 useMutation 콜백에 둔다.
    mutate(result.data, {
      onSuccess: goToHotel,
      onError: (error) => {
        setIsSubmitting(false);
        showSubmitError(error);
      },
    });
  }

  return {
    formRef,
    values,
    fieldErrors,
    formError,
    isSubmitting,
    changeHotelInfo,
    changeMaster,
    handleSubmit,
    cancel: () => void navigate({ to: "/hotels" }),
  };
}
