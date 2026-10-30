import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FormSection } from "./form-section";

describe("FormSection", () => {
  it("입력창을 legend가 이름인 fieldset으로 묶는다", () => {
    render(
      <FormSection legend="호텔 정보">
        <input aria-label="이름" />
        <input aria-label="주소" />
      </FormSection>,
    );

    const group = screen.getByRole("group", { name: "호텔 정보" });
    expect(group.tagName).toBe("FIELDSET");
    expect(within(group).getAllByRole("textbox")).toEqual([
      screen.getByLabelText("이름"),
      screen.getByLabelText("주소"),
    ]);
  });

  it("묶음을 테두리가 있는 흰색 카드 안에 보여준다", () => {
    render(
      <FormSection legend="호텔 정보">
        <input aria-label="이름" />
      </FormSection>,
    );

    expect(
      screen.getByRole("group", { name: "호텔 정보" }).closest(".bg-white"),
    ).toHaveClass("border", "border-neutral-200");
  });
});
