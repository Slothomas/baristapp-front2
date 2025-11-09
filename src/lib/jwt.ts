import CryptoJS from "crypto-js";

// mantener en .env en un backend real
const SECRET = "baristapp-demo-secret";

function base64url(input: string) {
  return input.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function toBase64Url(obj: any) {
  return base64url(btoa(unescape(encodeURIComponent(JSON.stringify(obj)))));
}
function fromBase64Url(s: string) {
  return JSON.parse(decodeURIComponent(escape(atob(s.replace(/-/g, "+").replace(/_/g, "/")))));
}

export type JWTPayload = {
  sub: string;
  role: "barista" | "cafe" | "academy" | "admin";
  name: string;
  email?: string;
  iat: number;
  exp: number;
};

export function signJWT(payload: Omit<JWTPayload, "iat" | "exp">, ttlSec: number): string {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: JWTPayload = { ...payload, iat: now, exp: now + ttlSec };

  const h = toBase64Url(header);
  const p = toBase64Url(fullPayload);
  const sig = CryptoJS.HmacSHA256(`${h}.${p}`, SECRET).toString(CryptoJS.enc.Base64);
  const s = base64url(sig);
  return `${h}.${p}.${s}`;
}

export function verifyJWT(token: string): JWTPayload | null {
  try {
    const [h, p, s] = token.split(".");
    if (!h || !p || !s) return null;
    const sigNow = base64url(
      CryptoJS.HmacSHA256(`${h}.${p}`, SECRET).toString(CryptoJS.enc.Base64)
    );
    if (sigNow !== s) return null;
    const payload = fromBase64Url(p) as JWTPayload;
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp <= now) return null;
    return payload;
  } catch {
    return null;
  }
}
