import type {
  FieldValues,
  Path,
  UseFormRegisterReturn,
  UseFormReturn,
} from "react-hook-form";

export type FormFieldProps = UseFormRegisterReturn & { error?: string };

export function toFieldProps<T extends FieldValues, C, O>(
  form: UseFormReturn<T, C, O>,
  name: Path<T>,
): FormFieldProps {
  return {
    ...form.register(name, {
      onChange: () => {
        if (form.getFieldState(name).error) {
          form.clearErrors(name);
        }
      },
    }),
    error: form.getFieldState(name, form.formState).error?.message,
  };
}

export function toFieldPropsMap<T extends FieldValues, C, O, F extends Path<T>>(
  form: UseFormReturn<T, C, O>,
  fields: readonly F[],
) {
  return Object.fromEntries(
    fields.map((field) => [field, toFieldProps(form, field)]),
  ) as Record<F, FormFieldProps>;
}
