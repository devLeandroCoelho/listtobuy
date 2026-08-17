const COOKIE_CONSENT_KEY = 'listtobuy_cookie_consent';

export type CookieConsent = 'accepted' | 'rejected' | null;

export function getCookieConsent(): CookieConsent {
  if (typeof window === 'undefined') return null;
  const value = localStorage.getItem(COOKIE_CONSENT_KEY);
  if (value === 'accepted' || value === 'rejected') return value;
  return null;
}

export function setCookieConsent(consent: CookieConsent): void {
  if (typeof window === 'undefined') return;
  if (consent === null) {
    localStorage.removeItem(COOKIE_CONSENT_KEY);
  } else {
    localStorage.setItem(COOKIE_CONSENT_KEY, consent);
  }
}

export function canUseAnalytics(): boolean {
  return getCookieConsent() === 'accepted';
}
