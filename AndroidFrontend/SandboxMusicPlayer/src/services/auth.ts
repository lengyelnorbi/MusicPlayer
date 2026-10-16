import * as SecureStore from 'expo-secure-store';
import { getEndpoint } from '@/services/apiConfig';

const ACCESS_TOKEN_KEY = 'music_app_access_token';
const REFRESH_TOKEN_KEY = 'music_app_refresh_token';
const USER_KEY = 'music_app_user';

const sessionListeners = new Set<(session: StoredSession | null) => void>();
let refreshInFlight: Promise<StoredSession | null> | null = null;

function notifySessionChanged(session: StoredSession | null) {
  sessionListeners.forEach(listener => listener(session));
}

export function subscribeToSessionChanges(listener: (session: StoredSession | null) => void): () => void {
  sessionListeners.add(listener);
  return () => { sessionListeners.delete(listener); };
}

export type AuthUser = {
  id?: number | string;
  ID?: number | string;
  username?: string;
  Username?: string;
  email?: string;
  Email?: string;
  [key: string]: unknown;
};

export type StoredSession = {
  accessToken: string;
  refreshToken?: string;
  user?: AuthUser;
  savedAt: string;
};

// Matches AuthController.MobileLogin in the supplied ASP.NET backend.
const LOGIN_PATH = '/api/auth/mobile';

type LoginResponse = {
  success?: boolean;
  expiresIn?: number;
  refreshTokenExpiresIn?: number;
  accessToken?: string;
  access_token?: string;
  token?: string;
  refreshToken?: string;
  refresh_token?: string;
  user?: AuthUser;
  [key: string]: unknown;
};

export async function loginWithPassword(emailAddress: string, password: string): Promise<StoredSession> {
  const response = await fetch(getEndpoint(LOGIN_PATH), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email: emailAddress.trim(), password, source: 'user' }),
  });

  const body = (await response.json().catch(() => ({}))) as LoginResponse;
  if (!response.ok) {
    const message = typeof body.message === 'string'
      ? body.message
      : typeof body.error === 'string'
        ? body.error
        : typeof body.title === 'string'
          ? body.title
          : `Login failed (${response.status}). Check the API URL and credentials.`;
    throw new Error(message);
  }

  const accessToken = body.accessToken ?? body.access_token ?? body.token;
  if (!accessToken || typeof accessToken !== 'string') {
    throw new Error('The API did not return an access token. Check that POST /api/auth/mobile returns accessToken.');
  }

  const refreshToken = body.refreshToken ?? body.refresh_token;
  const user = body.user ?? undefined;
  const session: StoredSession = {
    accessToken,
    ...(typeof refreshToken === 'string' ? { refreshToken } : {}),
    ...(user ? { user } : {}),
    savedAt: new Date().toISOString(),
  };
  await saveSession(session);
  return session;
}

export async function saveSession(session: StoredSession): Promise<void> {
  // Write the access token last so loadStoredSession never treats a partially
  // written session as authenticated.
  try {
    if (session.refreshToken) {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, session.refreshToken);
    } else {
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    }

    if (session.user) {
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(session.user));
    } else {
      await SecureStore.deleteItemAsync(USER_KEY);
    }

    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, session.accessToken);
    notifySessionChanged(session);
  } catch {
    await clearStoredSession().catch(() => undefined);
    throw new Error("Could not securely save your session on this device.");
  }
}

export async function loadStoredSession(): Promise<StoredSession | null> {
  const accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  if (!accessToken) return null;
  const [refreshToken, userJson] = await Promise.all([
    SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.getItemAsync(USER_KEY),
  ]);
  let user: AuthUser | undefined;
  try { user = userJson ? JSON.parse(userJson) as AuthUser : undefined; } catch { user = undefined; }
  return {
    accessToken,
    ...(refreshToken ? { refreshToken } : {}),
    ...(user ? { user } : {}),
    savedAt: 'previously saved',
  };
}

export async function clearStoredSession(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.deleteItemAsync(USER_KEY),
  ]);
  notifySessionChanged(null);
}

async function performRefresh(): Promise<StoredSession | null> {
  const current = await loadStoredSession();
  if (!current?.refreshToken) return null;

  let response: Response;
  try {
    response = await fetch(getEndpoint('/api/auth/mobile/refresh'), {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: current.refreshToken }),
    });
  } catch {
    // A transient network failure should not destroy a still-useful refresh token.
    return null;
  }

  if (!response.ok) {
    if (response.status === 400 || response.status === 401 || response.status === 403) {
      await clearStoredSession();
    }
    return null;
  }

  const body = await response.json().catch(() => ({})) as LoginResponse;
  const accessToken = body.accessToken ?? body.access_token ?? body.token;
  const refreshToken = body.refreshToken ?? body.refresh_token;
  if (typeof accessToken !== 'string' || !accessToken || typeof refreshToken !== 'string' || !refreshToken) {
    await clearStoredSession();
    return null;
  }

  const updated: StoredSession = {
    accessToken,
    refreshToken,
    ...(current.user ? { user: current.user } : {}),
    savedAt: new Date().toISOString(),
  };
  await saveSession(updated);
  return updated;
}

/** Refreshes once at a time so concurrent 401 responses do not race token rotation. */
export function refreshStoredSession(): Promise<StoredSession | null> {
  if (!refreshInFlight) {
    refreshInFlight = performRefresh().finally(() => { refreshInFlight = null; });
  }
  return refreshInFlight;
}
/** Revoke the current native session when online, then always clear local credentials. */
export async function logoutSession(): Promise<void> {
  const session = await loadStoredSession().catch(() => null);
  if (session?.accessToken) {
    try {
      await fetch(getEndpoint('/api/auth/mobile/logout'), {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ refreshToken: session.refreshToken ?? '' }),
      });
    } catch {
      // Local sign-out must still work when the device is offline.
    }
  }
  await clearStoredSession();
}

