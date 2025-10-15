import React from "react";

interface CustomCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

const CustomCheckbox: React.FC<CustomCheckboxProps> = ({ checked, onChange, label }) => {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <span className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={e => onChange(e.target.checked)}
          className="peer appearance-none w-6 h-6 rounded-lg border-2 border-gray-300 bg-white transition-all duration-200 shadow-sm focus:ring-2 focus:ring-[#2A2AD7] checked:border-[#2A2AD7] checked:bg-[#2A2AD7]"
        />
        <span className="pointer-events-none absolute left-0 top-0 w-6 h-6 flex items-center justify-center">
          {checked && (
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M5 10.5L9 14.5L15 7.5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>
      </span>
      <span className="text-base text-[#091747]">{label}</span>
    </label>
  );
};

export default CustomCheckbox;
