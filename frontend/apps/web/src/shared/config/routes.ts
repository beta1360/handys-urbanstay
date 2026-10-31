export const ROUTES = {
  hotels: "/",
  login: "/login",
  signup: "/signup",
  hotelRooms: (hotelId: number) => `/hotels/${hotelId}`,
  roomBooking: (hotelId: number, roomId: number) =>
    `/hotels/${hotelId}/rooms/${roomId}`,
} as const;
