import { MyStayFeed, MyStayListEmpty } from "@/entities/stay";
import { loadMyStays } from "../model/load-my-stays";

export async function MyStays() {
  const state = await loadMyStays();

  if (state.status === "empty") {
    return <MyStayListEmpty />;
  }
  return <MyStayFeed initialPages={state.initialPages} />;
}
