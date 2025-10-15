import React from 'react';
import RawLogo from '@/assets/logo-fauves.svg?react';

interface LogoFauvesProps {
  variant?: 'brand' | 'white' | 'mono';
  className?: string;
  width?: number | string;
  height?: number | string;
  title?: string;
}

// Using SVGR (?react) so we can control fills via class.
export const LogoFauves: React.FC<LogoFauvesProps> = ({ variant = 'brand', className = '', width = 120, height, title }) => {
  const style: React.CSSProperties = {};
  let extraClass = '';
  if (variant === 'white') {
    // Use inversion via CSS filters for quick recolor; TODO: provide dedicated white asset if needed.
    extraClass = 'logo-fauves-white';
  } else if (variant === 'mono') {
    extraClass = 'logo-fauves-mono';
  }
  // Normalize width (allow string like '140') then clamp to 100 max
  const numericWidth = typeof width === 'number' ? width : parseInt(width as string, 10) || 120;
  const clampedWidth = Math.min(numericWidth, 100);
  // If explicit height provided, use it; otherwise let SVG preserve aspect ratio by not forcing height
  const numericHeight = height ? (typeof height === 'number' ? height : parseInt(height as string, 10)) : undefined;
  const sizeProps = { width: clampedWidth, height: numericHeight };
  const aria = title || 'Fauves';
  return (
    <span className={`block leading-none ${className} ${extraClass}`} aria-label={aria} role="img">
      <RawLogo {...sizeProps} />
    </span>
  );
};

export default LogoFauves;
