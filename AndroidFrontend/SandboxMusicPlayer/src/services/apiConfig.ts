import { environment } from "@/environment";

const configuredUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
const fallbackUrl = `${environment.urlBase}${environment.apiBaseUrl}:${environment.apiPort}`;
const API_BASE_URL = (configuredUrl || fallbackUrl).replace(/\/+$/, "");

export function getEndpoint(path: string): string {
  if (!API_BASE_URL || API_BASE_URL.includes("undefined")) {
    throw new Error(
      "API base URL is not configured. Set EXPO_PUBLIC_API_BASE_URL in your .env file.",
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(API_BASE_URL);
  } catch {
    throw new Error(
      `Invalid API base URL: "${API_BASE_URL}". Use a full URL such as http://10.0.2.2:8080.`,
    );
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("The API base URL must use HTTP or HTTPS.");
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}
