import React, { useEffect, useState } from 'react';

type Props = {
  size?: number;
  className?: string;
};

const CheckIcon: React.FC<Props> = ({ size = 18, className }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // slight delay so transition runs after mount
    const t = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(t);
  }, []);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={`${mounted ? 'scale-100' : 'scale-75'} transform transition-transform duration-200 ${className || ''}`}
      aria-hidden
    >
      {/* ensure no inherited stroke on the circle */}
      <circle cx="12" cy="12" r="12" fill="#64CB9C" stroke="none" />
      {/* white check path with explicit stroke and no fill to avoid outlines */}
      <path d="M18 7L10.5 15.5L7 12" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" shapeRendering="geometricPrecision" />
    </svg>
  );
};

export default CheckIcon;
