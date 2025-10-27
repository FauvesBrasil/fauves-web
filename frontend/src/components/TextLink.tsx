import React from 'react';

interface TextLinkProps {
  href?: string;
  onClick?: (e?: React.MouseEvent) => void;
  className?: string;
  children: React.ReactNode;
  target?: string;
  rel?: string;
}

const TextLink: React.FC<TextLinkProps> = ({ href, onClick, className = '', children, target, rel }) => {
  const base = 'relative inline-flex items-center font-semibold text-indigo-600 group focus:outline-none transition-transform duration-200 hover:-translate-y-0.5';

  const content = (
    <>
      <span className="relative z-10">{children}</span>
      {/* underline: use transform scaleX to avoid layout changes */}
      <span className="absolute left-0 bottom-0 h-0.5 w-full origin-left transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600" />
      {/* subtle glow, opacity only (no width changes) */}
      <span className="absolute left-0 bottom-0.5 h-2 w-full opacity-0 rounded-full bg-indigo-200 blur-md transition-opacity duration-300 group-hover:opacity-60" />
    </>
  );

  if (href) {
    return (
      <a href={href} target={target} rel={rel} className={`${base} ${className}`}> {content} </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={`${base} ${className}`}> {content} </button>
  );
};

export default TextLink;
