import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { APP_INFO } from "@/shared/config";
import { APP_HEADER_MESSAGES } from "../config/messages";
import { AppHeader } from "./app-header";

describe("AppHeader", () => {
  it("헤더에 앱 이름과 마이페이지 버튼을 보여준다", () => {
    render(<AppHeader />);

    expect(screen.getByText(APP_INFO.name)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: APP_HEADER_MESSAGES.myPageLabel }),
    ).toBeInTheDocument();
  });
});
