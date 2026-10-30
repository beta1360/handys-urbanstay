import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Toast, ToastRegion } from "./toast";

describe("ToastRegion", () => {
  it("전달받은 이름의 영역 안에 토스트를 보여준다", () => {
    render(
      <ToastRegion aria-label="알림">
        <Toast type="success" closeLabel="알림 닫기" onClose={() => {}}>
          저장했습니다.
        </Toast>
      </ToastRegion>,
    );

    const region = screen.getByRole("region", { name: "알림" });
    expect(within(region).getByRole("status")).toHaveTextContent(
      "저장했습니다.",
    );
  });
});

describe("Toast", () => {
  it.each([
    ["success", "status"],
    ["error", "alert"],
  ] as const)("%s 토스트는 %s 역할로 문구를 알린다", (type, role) => {
    render(
      <Toast type={type} closeLabel="알림 닫기" onClose={() => {}}>
        문구
      </Toast>,
    );

    expect(screen.getByRole(role)).toHaveTextContent("문구");
  });

  it("닫기 버튼은 전달받은 이름으로 읽히고 누르면 onClose를 호출한다", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Toast type="error" closeLabel="알림 닫기" onClose={onClose}>
        문구
      </Toast>,
    );

    const closeButton = within(screen.getByRole("alert")).getByRole("button", {
      name: "알림 닫기",
    });
    expect(closeButton).toHaveAttribute("type", "button");

    await user.click(closeButton);

    expect(onClose).toHaveBeenCalledOnce();
  });
});
