export type NamedCookie = { name: string };

export function hasSupabaseSessionCookie(cookies: NamedCookie[]) {
  return cookies.some(
    (cookie) => cookie.name.startsWith("sb-") && cookie.name.includes("-auth-token"),
  );
}
