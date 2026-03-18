interface PopularTimesChartProps {
  data: number[];
  currentHour: number;
}

export function PopularTimesChart({ data, currentHour }: PopularTimesChartProps) {
  const maxVal = Math.max(...data, 1);

  return (
    <div>
      <div className="flex items-end gap-0.5 h-10">
        {data.map((val, i) => (
          <div
            key={i}
            className={`flex-1 min-w-[3px] rounded-t-sm transition-colors ${
              i === currentHour
                ? "bg-gradient-to-t from-purple-600 to-indigo-600 shadow-sm shadow-indigo-600/25"
                : "bg-gray-200"
            }`}
            style={{ height: `${(val / maxVal) * 100}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between text-[9px] text-gray-400 mt-0.5">
        <span>8 AM</span>
        <span>12 PM</span>
        <span>4 PM</span>
        <span>8 PM</span>
      </div>
    </div>
  );
}
