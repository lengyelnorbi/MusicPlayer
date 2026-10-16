import { loadStoredSession, refreshStoredSession, type StoredSession } from "@/services/auth";
import { getEndpoint } from "@/services/apiConfig";

type ApiRequestOptions = RequestInit & {
  /** Disable bearer-token attachment for a public endpoint. */
  public?: boolean;
};

/**
 * Shared fetch wrapper for the ASP.NET API. The server uses bearer tokens for
 * authenticated mobile requests; browser cookie credentials are not relied on.
 */
export async function apiFetch(path: string, options: ApiRequestOptions = {}): Promise<Response> {
  const { public: isPublic = false, headers: suppliedHeaders, ...requestOptions } = options;
  const headers = new Headers(suppliedHeaders);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");

  const callerSuppliedAuthorization = headers.has("Authorization");
  let session: StoredSession | null = null;
  if (!isPublic && !callerSuppliedAuthorization) {
    session = await loadStoredSession();
    if (session?.accessToken) headers.set("Authorization", `Bearer ${session.accessToken}`);
  }

  const url = getEndpoint(path);
  const response = await fetch(url, { ...requestOptions, headers });
  if (response.status !== 401 || isPublic || callerSuppliedAuthorization || !session?.refreshToken) {
    return response;
  }

  const refreshed = await refreshStoredSession();
  if (!refreshed?.accessToken) return response;

  headers.set("Authorization", `Bearer ${refreshed.accessToken}`);
  return fetch(url, { ...requestOptions, headers });
}

export async function responseError(response: Response, fallback: string): Promise<Error> {
  const raw = await response.text().catch(() => "");
  if (raw) {
    try {
      const body: unknown = JSON.parse(raw);
      if (body && typeof body === "object") {
        const value = body as Record<string, unknown>;
        for (const key of ["message", "error", "title", "detail"]) {
          if (typeof value[key] === "string" && value[key]) {
            return new Error(value[key] as string);
          }
        }
      }
    } catch {
      // The server may return plain text instead of JSON.
      if (raw.trim()) return new Error(raw.trim().slice(0, 240));
    }
  }
  return new Error(`${fallback} (HTTP ${response.status})`);
}
