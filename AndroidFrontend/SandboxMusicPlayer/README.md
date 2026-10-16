# My Music — Expo / React Native

A native music catalogue client with email/password authentication, playlists, online streaming, offline audio downloads, and a local SQLite snapshot export.

## Requirements

- Node.js supported by the Expo SDK listed in `package.json`
- Android Studio emulator, physical Android device, or iOS simulator
- The ASP.NET API running at a URL reachable from the device

## Setup

1. Install dependencies:

   ```bash
   npm ci
   ```

2. Copy `.env.example` to `.env` and set `EXPO_PUBLIC_API_BASE_URL`.

   - Android emulator: `http://10.0.2.2:8080`
   - Physical device: `http://YOUR_COMPUTER_LAN_IP:8080`
   - Production: use your HTTPS API URL.

3. Start the app:

   ```bash
   npm start
   ```

4. Run the TypeScript check:

   ```bash
   npm run typecheck
   ```

## Implemented frontend features

- Login through `POST /api/auth/mobile`; access token is stored with Expo SecureStore
- Bearer-authenticated API calls through `src/services/apiClient.ts`
- Music catalogue, search, genre filtering, and pagination
- Playback using `expo-audio` and `GET /api/music/{id}/stream`
- Offline downloads stored under the app's persistent document directory
- Offline metadata in `offline-music.db`
- Optional database snapshot import from `GET /api/mobile/sqlite-export`
- Account playlists and playlist membership operations

## Backend integration notes

The included backend folder in the companion project ZIP contains the supplied controller/service files, not the complete ASP.NET solution. Merge the updated `.cs` files into your API project and run that project's own build and tests.

The SQLite export endpoint is now authenticated and derives the user ID from the validated token; the client no longer supplies a `userId` query parameter. Password hashes are excluded from the local export. Playlist listing and membership mutation validate ownership server-side.

The mobile login endpoint currently accepts an email address, not a username. The API's stream endpoint is public in the supplied backend; the app uses it for playback and offline download. If you deploy the API outside a trusted development network, configure HTTPS and review the stream endpoint's access policy.

## Network troubleshooting

- `localhost` on a physical phone refers to the phone, not the development computer.
- Make sure the API listens on an address reachable from the device and the firewall allows the configured port.
- Never commit `.env` or production credentials. `.env.example` contains only a placeholder URL.
