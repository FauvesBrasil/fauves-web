import * as React from 'react';

interface DateRangePickerProps {
  startDate: string;
  endDate?: string;
  onChange: (start: string, end?: string) => void;
  minDate?: string;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({ startDate, endDate, onChange, minDate }) => {
  return (
    <div className="flex gap-2 items-center">
      <div className="flex-1">
        <label className="text-xs text-gray-600 block mb-1">De</label>
        <input
          type="date"
          className="w-full border rounded-md px-3 py-2"
          value={startDate}
          min={minDate}
          onChange={(e) => {
            const s = e.target.value;
            // ensure end is not before start: if end exists and smaller, clear end
            if (endDate && s > endDate) {
              onChange(s, s);
            } else {
              onChange(s, endDate);
            }
          }}
        />
      </div>
      <div className="flex-1">
        <label className="text-xs text-gray-600 block mb-1">Até</label>
        <input
          type="date"
          className="w-full border rounded-md px-3 py-2"
          value={endDate || ''}
          min={startDate || minDate}
          onChange={(e) => onChange(startDate, e.target.value)}
        />
      </div>
    </div>
  );
};

export default DateRangePicker;
