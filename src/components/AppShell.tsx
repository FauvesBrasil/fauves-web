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
  className = '',
}) => {
  const isCheckout = variant === 'checkout';
  // Base classes para o wrapper principal
  const base = 'min-h-screen flex flex-col bg-background text-foreground';
  const variantClass = isCheckout ? 'bg-white' : '';
    return (
      <div className={`${base} ${variantClass} ${className}`}>
        {!noHeader && <Header />}
        <main className={isCheckout ? 'flex-1 w-full' : 'flex-1 w-full'}>{children}</main>
        {!noFooter && !isCheckout && <Footer />}
      </div>
    );
};

export default AppShell;