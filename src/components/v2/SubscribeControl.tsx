import React, { FormEvent, useEffect, useRef, useState } from 'react';
import { UserRoundMinus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

type SubscribeControlProps = {
  scope: string;
  compact?: boolean;
  className?: string;
};

const SubscribeControl: React.FC<SubscribeControlProps> = ({ scope, compact = false, className = '' }) => {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const subscriber = user?.email || email.trim().toLowerCase();
  const storageKey = subscriber ? `fauves:subscription:${scope}:${subscriber}` : '';

  useEffect(() => {
    const identity = user?.email?.trim().toLowerCase();
    setMenuOpen(false);
    setSubscribed(identity ? localStorage.getItem(`fauves:subscription:${scope}:${identity}`) === 'active' : false);
  }, [scope, user?.email]);

  useEffect(() => {
    const sync = (event: Event) => {
      const detail = (event as CustomEvent<{ key: string; active: boolean }>).detail;
      if (detail?.key === storageKey) setSubscribed(detail.active);
    };
    window.addEventListener('fauves-subscription-change', sync);
    return () => window.removeEventListener('fauves-subscription-change', sync);
  }, [storageKey]);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  const subscribe = (event: FormEvent) => {
    event.preventDefault();
    if (!subscriber) return;
    localStorage.setItem(storageKey, 'active');
    setSubscribed(true);
    window.dispatchEvent(new CustomEvent('fauves-subscription-change', { detail: { key: storageKey, active: true } }));
  };

  const unsubscribe = () => {
    if (storageKey) localStorage.removeItem(storageKey);
    setSubscribed(false);
    window.dispatchEvent(new CustomEvent('fauves-subscription-change', { detail: { key: storageKey, active: false } }));
    setMenuOpen(false);
  };

  return (
    <div ref={rootRef} className={`subscribe-control ${compact ? 'is-compact' : ''} ${className}`}>
      {subscribed ? (
        <div className="subscribe-control-status">
          <button
            className="subscribe-control-subscribed"
            type="button"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            Inscrito
          </button>
          {menuOpen && (
            <div className="subscribe-control-menu" role="menu">
              <button type="button" role="menuitem" onClick={unsubscribe}>
                <UserRoundMinus size={17} strokeWidth={1.7} />
                Cancelar inscrição
              </button>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={subscribe}>
          {!user && (
            <>
              <label className="sr-only" htmlFor={`subscribe-${scope}-${compact ? 'compact' : 'wide'}`}>Email</label>
              <input
                id={`subscribe-${scope}-${compact ? 'compact' : 'wide'}`}
                type="email"
                placeholder="me@email.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </>
          )}
          <button className="subscribe-control-action" type="submit">Assinar</button>
        </form>
      )}
      <style>{subscribeControlStyles}</style>
    </div>
  );
};

const subscribeControlStyles = `
  .subscribe-control { position: relative; width: 100%; max-width: 320px; }
  .subscribe-control form { display: flex; align-items: center; gap: 8px; }
  .subscribe-control input {
    min-width: 0; height: 38px; flex: 1; padding: 0 16px; border: 0; border-radius: 999px;
    outline: none; color: rgba(255,255,255,.88); background: rgba(255,255,255,.065);
    font: inherit; font-size: .875rem;
  }
  .subscribe-control input::placeholder { color: rgba(255,255,255,.35); }
  .subscribe-control input:focus { box-shadow: 0 0 0 1px rgba(255,255,255,.22); }
  .subscribe-control-action,
  .subscribe-control-subscribed {
    height: 38px; min-width: 86px; padding: 0 18px; border: 0; border-radius: 999px;
    cursor: pointer; font: inherit; font-size: .875rem; font-weight: 500;
  }
  .subscribe-control-action { color: #151719; background: #fff; }
  .subscribe-control-action:hover { background: rgba(255,255,255,.9); }
  .subscribe-control-status { position: relative; display: inline-flex; }
  .subscribe-control-subscribed { color: rgba(255,255,255,.62); background: rgba(255,255,255,.10); }
  .subscribe-control-subscribed:hover { background: rgba(255,255,255,.13); }
  .subscribe-control-menu {
    position: absolute; z-index: 30; top: calc(100% + 8px); left: 0; width: max-content;
    padding: 5px; border: 1px solid rgba(255,255,255,.09); border-radius: 9px;
    background: rgba(36,38,40,.82); box-shadow: 0 18px 48px rgba(0,0,0,.38);
    -webkit-backdrop-filter: blur(24px) saturate(160%); backdrop-filter: blur(24px) saturate(160%);
  }
  .subscribe-control-menu button {
    display: flex; align-items: center; gap: 9px; height: 36px; padding: 0 11px; border: 0;
    border-radius: 6px; color: rgba(255,255,255,.88); background: rgba(255,255,255,.045);
    cursor: pointer; white-space: nowrap; font: inherit; font-size: .875rem; font-weight: 500;
  }
  .subscribe-control-menu button:hover { background: rgba(255,255,255,.09); }
  .subscribe-control-menu svg { color: rgba(255,255,255,.52); }
  .subscribe-control.is-compact { max-width: none; }
  .subscribe-control.is-compact form { flex-direction: column; align-items: stretch; }
  .subscribe-control.is-compact .subscribe-control-action { width: 100%; }
`;

export default SubscribeControl;
