import type { ComponentProps } from "react";
import { joinClassNames } from "./class-names";
import { Field, FIELD_CONTROL_CLASS_NAME } from "./field";
import type { FieldProps } from "./field";

export type SelectFieldOption = {
  value: string;
  label: string;
};

type SelectFieldProps = Omit<ComponentProps<"select">, "children"> &
  FieldProps & {
    options: readonly SelectFieldOption[];
  };

export function SelectField({
  label,
  hint,
  error,
  id,
  className,
  options,
  ...props
}: SelectFieldProps) {
  return (
    <Field
      id={id}
      label={label}
      hint={hint}
      error={error}
      className={className}
    >
      {(controlProps) => (
        <select
          {...props}
          {...controlProps}
          className={joinClassNames("h-10", FIELD_CONTROL_CLASS_NAME)}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}
