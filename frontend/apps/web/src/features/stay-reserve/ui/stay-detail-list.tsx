type StayDetailListProps = {
  rows: { label: string; value: string }[];
};

export function StayDetailList({ rows }: StayDetailListProps) {
  return (
    <dl className="flex flex-col divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white px-4">
      {rows.map(({ label, value }) => (
        <div key={label} className="flex justify-between gap-4 py-3 text-sm">
          <dt className="shrink-0 text-gray-500">{label}</dt>
          <dd className="text-right font-medium text-gray-900">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
