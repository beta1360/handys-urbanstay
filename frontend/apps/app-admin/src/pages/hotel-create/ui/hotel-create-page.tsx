import { Button } from "@repo/ui/button";
import { HotelInfoFields } from "@/features/hotel-info-form";
import { COMMON_MESSAGES } from "@/shared/config";
import { ButtonLink } from "@/shared/ui";
import { HOTEL_CREATE_MESSAGES } from "../config/messages";
import { useHotelCreateForm } from "../model/use-hotel-create-form";
import { MasterAccountFields } from "./master-account-fields";

export function HotelCreatePage() {
  const {
    formRef,
    values,
    fieldErrors,
    formError,
    isSubmitting,
    changeHotelInfo,
    changeMaster,
    handleSubmit,
  } = useHotelCreateForm();

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={handleSubmit}
      className="flex max-w-2xl flex-col gap-4"
    >
      <HotelInfoFields
        values={values}
        errors={fieldErrors}
        onChange={changeHotelInfo}
      />
      <MasterAccountFields
        values={values.master}
        errors={fieldErrors}
        onChange={changeMaster}
      />
      {formError ? (
        <p role="alert" className="text-sm text-red-600">
          {formError}
        </p>
      ) : null}
      <div className="flex gap-2">
        <Button type="submit" variant="primary" loading={isSubmitting}>
          {HOTEL_CREATE_MESSAGES.submit}
        </Button>
        <ButtonLink
          to="/hotels"
          activeOptions={{ exact: true }}
          variant="secondary"
        >
          {COMMON_MESSAGES.cancel}
        </ButtonLink>
      </div>
    </form>
  );
}
