export const ROUTES = {
  hotels: "/",
  login: "/login",
  signup: "/signup",
  myStays: "/me/stays",
  hotelRooms: (hotelId: number) => `/hotels/${hotelId}`,
  roomBooking: (hotelId: number, roomId: number) =>
    `/hotels/${hotelId}/rooms/${roomId}`,
} as const;
