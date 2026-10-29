import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, onTestFinished } from "vitest";
import { APP_INFO } from "@/shared/config";
import { LOGIN_MESSAGES } from "../config/messages";
import { LoginPage } from "./login-page";

describe("LoginPage", () => {
  it("앱 이름을 화면 제목으로 보여준다", () => {
    render(<LoginPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: APP_INFO.name }),
    ).toBeInTheDocument();
  });

  it("아이디 입력창은 일반 텍스트 형식이고 저장된 아이디로 자동 완성된다", () => {
    render(<LoginPage />);

    const loginIdInput = screen.getByLabelText(LOGIN_MESSAGES.loginIdLabel);
    expect(loginIdInput).toHaveAttribute("type", "text");
    expect(loginIdInput).toHaveAttribute("autocomplete", "username");
  });

  it("비밀번호 입력창은 입력값을 가리고 저장된 비밀번호로 자동 완성된다", () => {
    render(<LoginPage />);

    const passwordInput = screen.getByLabelText(LOGIN_MESSAGES.passwordLabel);
    expect(passwordInput).toHaveAttribute("type", "password");
    expect(passwordInput).toHaveAttribute("autocomplete", "current-password");
  });

  it("로그인 제출 버튼을 보여준다", () => {
    render(<LoginPage />);

    expect(
      screen.getByRole("button", { name: LOGIN_MESSAGES.submit }),
    ).toHaveAttribute("type", "submit");
  });

  it("로그인 버튼으로 제출하면 브라우저의 기본 제출 동작을 막는다", async () => {
    const user = userEvent.setup();
    const submitEvents: Event[] = [];
    const recordSubmit = (event: Event) => {
      submitEvents.push(event);
    };
    document.addEventListener("submit", recordSubmit);
    onTestFinished(() => {
      document.removeEventListener("submit", recordSubmit);
    });
    render(<LoginPage />);

    await user.click(
      screen.getByRole("button", { name: LOGIN_MESSAGES.submit }),
    );

    expect(submitEvents).toHaveLength(1);
    expect(submitEvents[0].defaultPrevented).toBe(true);
  });
});
