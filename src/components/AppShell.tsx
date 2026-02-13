import React from 'react';
import Header from './Header';
import Footer from './Footer';

interface AppShellProps {
  children: React.ReactNode;
  /** Layout variant to allow contextual adjustments (e.g., checkout hides footer) */
  variant?: 'default' | 'checkout' | 'plain';
  /** Optional flag to disable header */
  noHeader?: boolean;
  /** Optional flag to disable footer */
  noFooter?: boolean;
  /** Hide search bar and location selector on mobile (e.g., for Index page) */
  hideSearchOnMobile?: boolean;
  /** Hide search bar completely (for pages that implement their own search) */
  hideSearchBar?: boolean;
  className?: string;
}

/**
 * AppShell centraliza estrutura base: Header, Footer, main container e width constraints.
 * Variants permitem custom rápido para fluxos específicos sem duplicar layout.
 */
export const AppShell: React.FC<AppShellProps> = ({
  children,
  variant = 'default',
  noHeader,
  noFooter,
  hideSearchOnMobile = true,
  hideSearchBar = false,
  className = '',
}) => {
  const isCheckout = variant === 'checkout';
  // Base classes para o wrapper principal
  const base = 'min-h-screen flex flex-col bg-background text-foreground overflow-x-hidden';
  const variantClass = isCheckout ? 'bg-background' : '';
  return (
    <div className={`${base} ${variantClass} ${className}`}>
      {!noHeader && <Header hideSearchOnMobile={hideSearchOnMobile} hideSearchBar={hideSearchBar} />}
      <main className={isCheckout ? 'flex-1 w-full' : 'flex-1 w-full' + (!noHeader ? ' max-md:pt-[120px]' : '')}>{children}</main>
      {!noFooter && !isCheckout && <Footer />}
    </div>
  );
};

export default AppShell;