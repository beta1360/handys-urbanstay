import { useNavigate } from "@tanstack/react-router";
import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import { HOTEL_NOT_FOUND_MESSAGES } from "../config/messages";

export function HotelNotFound() {
  const navigate = useNavigate();

  return (
    <Card>
      <div className="flex flex-col items-center gap-4">
        <p role="alert" className="text-sm text-neutral-700">
          {HOTEL_NOT_FOUND_MESSAGES.description}
        </p>
        <Button
          variant="secondary"
          onClick={() => void navigate({ to: "/hotels" })}
        >
          {HOTEL_NOT_FOUND_MESSAGES.backToList}
        </Button>
      </div>
    </Card>
  );
}
