import { getCookie } from "hono/cookie";

export const sessions = new Map<string, any>();

export function getSessionUser(c: any) {
  const sessionId = getCookie(c, "session");
  if (!sessionId) return null;
  return sessions.get(sessionId) ?? null;
}

export function safeUser(user: any) {
  const { password, ...rest } = user;
  return rest;
}