// Simple session-backed checkout timer (10 minutes)
const KEY = 'checkoutTimerStart:v1';
const DURATION = 600; // seconds

export function ensureTimerStarted(){
  try{
    if (!sessionStorage.getItem(KEY)) sessionStorage.setItem(KEY, String(Date.now()));
  }catch(e){}
}

export function resetTimer(){
  try{ sessionStorage.setItem(KEY, String(Date.now())); }catch(e){}
}

export function getSecondsLeft(){
  try{
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return DURATION;
    const start = parseInt(raw,10);
    const elapsed = Math.floor((Date.now() - start)/1000);
    return Math.max(0, DURATION - elapsed);
  }catch(e){ return DURATION; }
}

export function clearTimer(){
  try{ sessionStorage.removeItem(KEY); }catch(e){}
}

export default { ensureTimerStarted, getSecondsLeft, resetTimer, clearTimer };
