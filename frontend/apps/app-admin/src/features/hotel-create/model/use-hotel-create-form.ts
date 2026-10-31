import type { FormEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import {
  showSubmitError,
  SUBMIT_ONLY_VALIDATION,
  toFieldPropsMap,
  useFormErrorToast,
} from "@repo/admin-kit/form";
import { showToast } from "@repo/admin-kit/toast";
import { API_ERROR_CODES, getApiError } from "@/shared/api";
import { useCreateHotel } from "../api/use-create-hotel";
import {
  EMPTY_HOTEL_CREATE_VALUES,
  HOTEL_CREATE_FIELDS,
  hotelCreateFormSchema,
} from "./hotel-create-form-schema";

export function useHotelCreateForm() {
  const { create } = useCreateHotel();
  const navigate = useNavigate();
  const errorToast = useFormErrorToast();
  const form = useForm({
    ...SUBMIT_ONLY_VALIDATION,
    resolver: zodResolver(hotelCreateFormSchema),
    defaultValues: EMPTY_HOTEL_CREATE_VALUES,
  });
  const { formState } = form;
  const fields = toFieldPropsMap(form, HOTEL_CREATE_FIELDS);
  const isSubmitting = formState.isSubmitting || formState.isSubmitSuccessful;

  const submit = form.handleSubmit(
    (body) =>
      new Promise<void>((resolve) => {
        // 화면을 떠난 뒤 끝난 요청은 이동하지 않도록 이동은 mutate 콜백에, 캐시 갱신은 useMutation 콜백에 둔다.
        create(body, {
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
            showSubmitError(getApiError(error), {
              fields: HOTEL_CREATE_FIELDS,
              setError: form.setError,
              fieldOfCode: {
                [API_ERROR_CODES.loginIdDuplicated]: "master.loginId",
              },
              onAlert: ({ message }) => errorToast.show(message),
            });
            resolve();
          },
        });
      }),
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (isSubmitting) {
      event.preventDefault();
      return;
    }
    errorToast.dismiss();
    void submit(event);
  }

  return { fields, isSubmitting, handleSubmit };
}
