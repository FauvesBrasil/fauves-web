import { ReactNode } from 'react';
import { AnimatedPage } from './AnimatedPage';

interface OrganizerLayoutProps {
  children: ReactNode;
}

export function OrganizerLayout({ children }: OrganizerLayoutProps) {
  return (
    <AnimatedPage>
      <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-slate-50 via-white to-white dark:from-[#050505] dark:via-[#0b0b0b] dark:to-[#0d0d0d]">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-28 h-72 w-72 rounded-full bg-gradient-to-br from-indigo-500/25 via-fuchsia-500/15 to-orange-400/10 blur-3xl" />
          <div className="absolute bottom-[-6rem] left-[-4rem] h-64 w-64 rounded-full bg-gradient-to-tr from-blue-500/12 via-indigo-500/10 to-sky-400/10 blur-3xl" />
        </div>
        <div className="relative">
          {children}
        </div>
      </div>
    </AnimatedPage>
  );
}
