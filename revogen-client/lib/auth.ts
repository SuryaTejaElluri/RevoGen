// Login session handling.
//
// The token lives in a session cookie (no expiry date), so:
//  - refreshing a page keeps you logged in (a candidate mid-test isn't kicked out)
//  - every tab shares the same login
//  - closing the browser ends the session; the next visit needs a fresh login
//
// Tokens used to be kept in localStorage for 7 days, which logged people in
// automatically with stale tokens. Any leftover copy is removed on first read.

const COOKIE = "rg_token";
const LEGACY_KEYS = ["access_token", "role"];

function readCookie(name: string): string | null {
  const match = document.cookie.split("; ").find(c => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

function clearLegacyStorage() {
  try {
    for (const k of LEGACY_KEYS) localStorage.removeItem(k);
  } catch { /* storage unavailable */ }
}

// Seconds-since-epoch expiry from the JWT payload, or null if the token can't be read.
function tokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

/** Current valid token, or null. Expired or malformed tokens are cleared. */
export function getToken(): string | null {
  if (typeof document === "undefined") return null;
  clearLegacyStorage();
  const token = readCookie(COOKIE);
  if (!token) return null;
  const exp = tokenExpiry(token);
  if (exp === null || exp * 1000 <= Date.now()) {
    clearSession();
    return null;
  }
  return token;
}

/** Store a fresh token after login, replacing any previous session. */
export function setSession(token: string) {
  clearSession();
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COOKIE}=${encodeURIComponent(token)}; Path=/; SameSite=Strict${secure}`;
}

/** Log out: remove the session cookie and any legacy stored token. */
export function clearSession() {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE}=; Path=/; Max-Age=0; SameSite=Strict`;
  clearLegacyStorage();
}
