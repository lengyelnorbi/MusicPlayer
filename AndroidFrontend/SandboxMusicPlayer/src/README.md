# Expo React Native music list conversion

## Files
- `MusicListScreen.tsx`: native music list, genre/search filters, pagination, dropdown actions and playlist modal.
- `musicService.ts`: music API calls.
- `playlistService.ts`: playlist API calls.
- `apiConfig.ts`: API base URL.
- `types.ts`: shared types.

## Setup
1. Copy these files into your Expo app (adjust import paths to match your project).
2. Add `.env`:
   `EXPO_PUBLIC_API_BASE_URL=http://YOUR_BACKEND_HOST:8080`
3. Render the screen:
   `<MusicListScreen loggedIn={isLoggedIn} onPlayMusic={playTrack} onRequestMusic={sendUploadRequest} onAddToFavorites={addFavorite} onDownloadMusic={downloadTrack} />`
4. Wire the callbacks to your existing app services. The upload-request and favorites API implementations were not included in the supplied Angular service code, so they are callbacks rather than invented endpoints.

## Backend/network notes
- Android emulator: `http://10.0.2.2:8080` usually reaches the host computer.
- iOS simulator: `http://localhost:8080` can usually reach the host computer.
- Physical phone: use the computer's LAN IP and ensure both devices are on the same network.
- Use HTTPS for production.
- React Native cookie/session behavior may require a cookie/session strategy or an auth library depending on your backend. `credentials: "include"` is retained from the Angular implementation but should be tested on target devices.
- Native file download is not identical to browser blob/anchor download. Install `expo-file-system` and `expo-sharing` and implement the suggested download flow in `musicService.ts` or your callback.

## Notes
The supplied Angular component uses an `AudioPlayerService`; its implementation was not included. The screen calls `onPlayMusic` so it can connect to your app's audio player. Likewise, favorites and upload request handling are callbacks because the relevant endpoint/service implementations were not supplied.
