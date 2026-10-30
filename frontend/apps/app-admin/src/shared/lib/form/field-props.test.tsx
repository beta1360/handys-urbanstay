import { act, renderHook } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";
import { toFieldPropsMap } from "./field-props";
import { SUBMIT_ONLY_VALIDATION } from "./form-options";
import { FORM_ALERT } from "./submit-error";

type Values = { name: string; phone: string };

const FIELDS = ["name", "phone"] as const;

function renderFieldProps() {
  return renderHook(() => {
    const form = useForm<Values>({
      ...SUBMIT_ONLY_VALIDATION,
      defaultValues: { name: "", phone: "" },
    });
    return { form, fields: toFieldPropsMap(form, FIELDS) };
  });
}

describe("toFieldPropsMap", () => {
  it("칸 오류가 생기면 다시 그려 그 칸의 error로 넘긴다", () => {
    const { result } = renderFieldProps();

    act(() => {
      result.current.form.setError("phone", { message: "전화번호 오류" });
    });

    expect(result.current.fields.phone.error).toBe("전화번호 오류");
    expect(result.current.fields.name.error).toBeUndefined();
  });

  it("입력하면 그 칸의 오류만 지우고 다른 칸 오류와 알림은 남긴다", async () => {
    const { result } = renderFieldProps();
    act(() => {
      result.current.form.setError("name", { message: "이름 오류" });
      result.current.form.setError("phone", { message: "전화번호 오류" });
      result.current.form.setError(FORM_ALERT, { message: "알림" });
    });

    await act(() =>
      result.current.fields.name.onChange({
        target: { name: "name", value: "새 이름" },
      }),
    );

    expect(result.current.fields.name.error).toBeUndefined();
    expect(result.current.fields.phone.error).toBe("전화번호 오류");
    expect(result.current.form.formState.errors.root?.server?.message).toBe(
      "알림",
    );
  });
});
