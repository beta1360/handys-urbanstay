import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { TextField } from "./text-field";

describe("TextField", () => {
  it("label을 누르면 연결된 입력창에 포커스한다", async () => {
    const user = userEvent.setup();
    render(<TextField label="이메일" />);

    await user.click(screen.getByText("이메일"));

    expect(screen.getByRole("textbox", { name: "이메일" })).toHaveFocus();
  });

  it("여러 개를 그려도 각 label은 자기 입력창과 연결된다", () => {
    render(
      <>
        <TextField label="이메일" />
        <TextField label="비밀번호" type="password" />
      </>,
    );

    const email = screen.getByLabelText("이메일");
    const password = screen.getByLabelText("비밀번호");
    expect(email).not.toBe(password);
    expect(password).toHaveAttribute("type", "password");
  });

  it("id를 넘기면 그 id로 label과 입력창을 연결한다", () => {
    render(<TextField id="login-email" label="이메일" />);

    expect(screen.getByLabelText("이메일")).toHaveAttribute(
      "id",
      "login-email",
    );
  });

  it("오류가 없으면 입력창에 오류 정보를 두지 않는다", () => {
    render(<TextField label="이메일" />);

    const input = screen.getByRole("textbox", { name: "이메일" });
    expect(input).not.toHaveAttribute("aria-invalid");
    expect(input).not.toHaveAttribute("aria-describedby");
  });

  it("오류가 있으면 입력창을 invalid로 표시하고 오류 문구와 연결한다", () => {
    render(<TextField label="이메일" error="이메일을 입력해 주세요." />);

    const input = screen.getByRole("textbox", { name: "이메일" });
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("이메일을 입력해 주세요.");
  });

  it("안내 문구가 있으면 입력창 아래에 보여주고 입력창과 연결한다", () => {
    render(<TextField label="전화번호" hint="숫자와 -만 입력합니다." />);

    const input = screen.getByRole("textbox", { name: "전화번호" });
    expect(input).not.toHaveAttribute("aria-invalid");
    expect(input).toHaveAccessibleDescription("숫자와 -만 입력합니다.");
  });

  it("안내 문구와 오류가 함께 있으면 입력창이 안내와 오류를 모두 가리킨다", () => {
    render(
      <TextField
        label="전화번호"
        hint="숫자와 -만 입력합니다."
        error="형식이 올바르지 않습니다."
      />,
    );

    const input = screen.getByRole("textbox", { name: "전화번호" });
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription(
      "숫자와 -만 입력합니다. 형식이 올바르지 않습니다.",
    );
  });

  it("입력한 값을 입력창에 보여준다", async () => {
    const user = userEvent.setup();
    render(<TextField label="이메일" />);

    const input = screen.getByRole("textbox", { name: "이메일" });
    await user.type(input, "admin@example.com");

    expect(input).toHaveValue("admin@example.com");
  });
});
