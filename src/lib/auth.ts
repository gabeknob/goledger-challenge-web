import Cookies from "js-cookie";

const COOKIE_KEY = "auth";

export function setCredentials(username: string, password: string): void {
  const encoded = btoa(`${username}:${password}`);
  Cookies.set(COOKIE_KEY, encoded, { expires: 7, sameSite: "strict" });
}

export function getCredentials(): string | undefined {
  return Cookies.get(COOKIE_KEY);
}

export function clearCredentials(): void {
  Cookies.remove(COOKIE_KEY);
}

export function isAuthenticated(): boolean {
  return Boolean(Cookies.get(COOKIE_KEY));
}
