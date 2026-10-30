import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { TextareaField } from "./textarea-field";

describe("TextareaField", () => {
  it("label을 누르면 연결된 여러 줄 입력창에 포커스한다", async () => {
    const user = userEvent.setup();
    render(<TextareaField label="소개" />);

    await user.click(screen.getByText("소개"));

    const textarea = screen.getByRole("textbox", { name: "소개" });
    expect(textarea.tagName).toBe("TEXTAREA");
    expect(textarea).toHaveFocus();
  });

  it("id를 넘기면 그 id로 label과 입력창을 연결한다", () => {
    render(<TextareaField id="hotel-description" label="소개" />);

    expect(screen.getByLabelText("소개")).toHaveAttribute(
      "id",
      "hotel-description",
    );
  });

  it("Enter로 줄을 바꿔 입력한 값을 그대로 보여준다", async () => {
    const user = userEvent.setup();
    render(<TextareaField label="소개" />);

    const textarea = screen.getByRole("textbox", { name: "소개" });
    await user.type(textarea, "첫 줄{Enter}둘째 줄");

    expect(textarea).toHaveValue("첫 줄\n둘째 줄");
  });

  it("안내 문구와 오류가 없으면 입력창에 설명 정보를 두지 않는다", () => {
    render(<TextareaField label="소개" />);

    const textarea = screen.getByRole("textbox", { name: "소개" });
    expect(textarea).not.toHaveAttribute("aria-invalid");
    expect(textarea).not.toHaveAttribute("aria-describedby");
  });

  it("안내 문구가 있으면 입력창 아래에 보여주고 입력창과 연결한다", () => {
    render(<TextareaField label="소개" hint="1000자까지 입력합니다." />);

    const textarea = screen.getByRole("textbox", { name: "소개" });
    expect(textarea).not.toHaveAttribute("aria-invalid");
    expect(textarea).toHaveAccessibleDescription("1000자까지 입력합니다.");
  });

  it("오류가 있으면 입력창을 invalid로 표시하고 안내 문구와 오류 문구를 모두 가리킨다", () => {
    render(
      <TextareaField
        label="소개"
        hint="1000자까지 입력합니다."
        error="1000자 이하로 입력해 주세요."
      />,
    );

    const textarea = screen.getByRole("textbox", { name: "소개" });
    expect(textarea).toHaveAttribute("aria-invalid", "true");
    expect(textarea).toHaveAccessibleDescription(
      "1000자까지 입력합니다. 1000자 이하로 입력해 주세요.",
    );
  });
});
