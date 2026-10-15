// Set EXPO_PUBLIC_API_BASE_URL in your .env.
// Example Android emulator: http://10.0.2.2:8080
// Example physical phone:   http://192.168.1.6:8080 (your computer's LAN IP)
// Production:                https://your-api.example.com
import { environment } from "@/environment";
const API_BASE_URL = `${environment.urlBase}${environment.apiBaseUrl}:${environment.apiPort}`;

export function getEndpoint(path: string): string {
  if (!API_BASE_URL) {
    throw new Error(
      "Missing EXPO_PUBLIC_API_BASE_URL. Set it in your Expo .env file."
    );
  }
  return API_BASE_URL + path;
}
