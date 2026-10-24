import { environment } from "@/environment";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "custom_api_base_url";

const configuredUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

const fallbackUrl =
  `${environment.urlBase}${environment.apiBaseUrl}:${environment.apiPort}`;

const DEFAULT_API_BASE_URL = (
  configuredUrl || fallbackUrl
).replace(/\/+$/, "");

let currentApiBaseUrl = DEFAULT_API_BASE_URL;
let initializationPromise: Promise<string> | null = null;

function validateUrl(value: string): string {
  const normalized = value.trim().replace(/\/+$/, "");

  let parsed: URL;

  try {
    parsed = new URL(normalized);
  } catch {
    throw new Error(
      "Invalid API URL. Enter a full URL, such as http://192.168.1.10:5000",
    );
  }

  if (
    (parsed.protocol !== "http:" && parsed.protocol !== "https:") ||
    !parsed.hostname ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash
  ) {
    throw new Error(
      "Enter a valid HTTP or HTTPS base URL without credentials, query parameters, or a fragment.",
    );
  }

  return normalized;
}

/** Load the saved URL once during app initialization. */
export function loadApiBaseUrl(): Promise<string> {
  if (!initializationPromise) {
    initializationPromise = (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);

        currentApiBaseUrl = saved
          ? validateUrl(saved)
          : validateUrl(DEFAULT_API_BASE_URL);
      } catch (error) {
        // Storage errors should not silently hide configuration problems.
        initializationPromise = null;
        throw error;
      }

      return currentApiBaseUrl;
    })();
  }

  return initializationPromise;
}

/** Read the currently active URL. */
export function getApiBaseUrl(): string {
  return currentApiBaseUrl;
}

/** Save and immediately activate a new URL. */
export async function saveApiBaseUrl(value: string): Promise<string> {
  const normalized = validateUrl(value);

  await AsyncStorage.setItem(STORAGE_KEY, normalized);

  currentApiBaseUrl = normalized;
  initializationPromise = Promise.resolve(normalized);

  return normalized;
}

/** Restore the .env/environment default. */
export async function resetApiBaseUrl(): Promise<string> {
  await AsyncStorage.removeItem(STORAGE_KEY);

  currentApiBaseUrl = validateUrl(DEFAULT_API_BASE_URL);
  initializationPromise = Promise.resolve(currentApiBaseUrl);

  return currentApiBaseUrl;
}

/** Build an endpoint using the currently active URL. */
export function getEndpoint(path: string): string {
  const baseUrl = validateUrl(currentApiBaseUrl);
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${baseUrl}${normalizedPath}`;
}