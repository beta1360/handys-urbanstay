import { Button } from "@repo/ui/button";
import { HotelNotFound } from "@/entities/hotel";
import { HotelInfoFields } from "@/features/hotel-info-form";
import type { Hotel } from "@/shared/api";
import { COMMON_MESSAGES } from "@/shared/config";
import { ButtonLink } from "@/shared/ui";
import { HOTEL_EDIT_MESSAGES } from "../config/messages";
import { useHotelEditForm } from "../model/use-hotel-edit-form";

type HotelEditFormProps = {
  hotelId: number;
  initialHotel: Hotel;
};

export function HotelEditForm({ hotelId, initialHotel }: HotelEditFormProps) {
  const {
    formRef,
    reloadButtonRef,
    values,
    fieldErrors,
    formError,
    status,
    changeField,
    handleSubmit,
    reload,
  } = useHotelEditForm(hotelId, initialHotel);

  if (status === "notFound") {
    return <HotelNotFound />;
  }
  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={handleSubmit}
      className="flex flex-col gap-4"
    >
      <HotelInfoFields
        values={values}
        errors={fieldErrors}
        onChange={changeField}
      />
      {formError ? (
        <div className="flex flex-wrap items-center gap-3">
          <p role="alert" className="text-sm text-red-600">
            {formError.message}
          </p>
          {formError.canReload ? (
            <Button
              ref={reloadButtonRef}
              type="button"
              variant="secondary"
              loading={status === "reloading"}
              onClick={reload}
            >
              {HOTEL_EDIT_MESSAGES.reload}
            </Button>
          ) : null}
        </div>
      ) : null}
      <div className="flex gap-2">
        <Button
          type="submit"
          variant="primary"
          loading={status === "submitting"}
          disabled={status === "reloading"}
        >
          {HOTEL_EDIT_MESSAGES.submit}
        </Button>
        <ButtonLink
          to="/hotels/$hotelId"
          params={{ hotelId }}
          activeOptions={{ exact: true }}
          variant="secondary"
        >
          {COMMON_MESSAGES.cancel}
        </ButtonLink>
      </div>
    </form>
  );
}
