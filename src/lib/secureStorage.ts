import CryptoJS from "crypto-js";

// en backend real no se cifra en cliente, se guarda server-side
const K = "baristapp-demo-aes";

export function sset(key: string, value: any) {
  const json = JSON.stringify(value);
  const enc = CryptoJS.AES.encrypt(json, K).toString();
  localStorage.setItem(key, enc);
}
export function sget<T = any>(key: string): T | null {
  const enc = localStorage.getItem(key);
  if (!enc) return null;
  try {
    const bytes = CryptoJS.AES.decrypt(enc, K);
    const json = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}
export function sdel(key: string) {
  localStorage.removeItem(key);
}
