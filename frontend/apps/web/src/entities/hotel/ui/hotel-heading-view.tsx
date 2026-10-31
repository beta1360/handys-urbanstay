type HotelHeadingViewProps = {
  caption: string;
  hotelName: string;
};

export function HotelHeadingView({ caption, hotelName }: HotelHeadingViewProps) {
  return (
    <hgroup className="flex flex-col gap-1">
      <p className="text-sm text-gray-500">{caption}</p>
      <h1 className="text-xl font-bold text-gray-900">{hotelName}</h1>
    </hgroup>
  );
}
