let activeLocks = 0;
let previousBodyOverflow = '';
let previousHtmlOverflow = '';
let lockGeneration = 0;

export function acquireDocumentScrollLock() {
  if (typeof document === 'undefined') return () => undefined;

  if (activeLocks === 0) {
    previousBodyOverflow = document.body.style.overflow;
    previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
  }

  activeLocks += 1;
  const generation = lockGeneration;
  let released = false;

  return () => {
    if (released) return;
    released = true;
    if (generation !== lockGeneration) return;
    activeLocks = Math.max(0, activeLocks - 1);

    if (activeLocks === 0) {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    }
  };
}

export function resetDocumentScrollLocks() {
  if (typeof document === 'undefined') return;
  lockGeneration += 1;
  activeLocks = 0;
  previousBodyOverflow = '';
  previousHtmlOverflow = '';
  document.body.style.removeProperty('overflow');
  document.documentElement.style.removeProperty('overflow');
}
