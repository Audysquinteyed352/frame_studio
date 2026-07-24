import { cookies } from "next/headers";

const API_KEY_COOKIE = "gemini_api_key";

export async function getApiKey(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(API_KEY_COOKIE)?.value || null;
}

export async function setApiKey(key: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(API_KEY_COOKIE, key, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: "/",
  });
}

export async function clearApiKey(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(API_KEY_COOKIE);
}
