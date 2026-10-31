import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { SelectField } from "./select-field";

const OPTIONS = [
  { value: "", label: "전체" },
  { value: "VACANT", label: "공실" },
  { value: "RESERVED", label: "예약됨" },
] as const;

describe("SelectField", () => {
  it("label과 연결된 선택 입력창에 받은 선택지를 보여주고 고른 값을 담는다", async () => {
    const user = userEvent.setup();
    render(<SelectField label="상태" options={OPTIONS} />);

    const select = screen.getByRole("combobox", { name: "상태" });
    expect(
      screen.getAllByRole("option").map((option) => option.textContent),
    ).toEqual(OPTIONS.map((option) => option.label));

    await user.selectOptions(select, "예약됨");

    expect(select).toHaveValue("RESERVED");
  });

  it("안내 문구와 오류가 있으면 invalid로 표시하고 안내와 오류를 모두 가리킨다", () => {
    render(
      <SelectField
        label="상태"
        options={OPTIONS}
        hint="하나를 고릅니다."
        error="상태를 골라 주세요."
      />,
    );

    const select = screen.getByRole("combobox", { name: "상태" });
    expect(select).toHaveAttribute("aria-invalid", "true");
    expect(select).toHaveAccessibleDescription(
      "하나를 고릅니다. 상태를 골라 주세요.",
    );
  });
});
