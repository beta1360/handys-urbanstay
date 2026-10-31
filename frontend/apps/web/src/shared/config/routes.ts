export const ROUTES = {
  hotels: "/",
  hotelRooms: (hotelId: number) => `/hotels/${hotelId}`,
  roomBooking: (hotelId: number, roomId: number) =>
    `/hotels/${hotelId}/rooms/${roomId}`,
} as const;
