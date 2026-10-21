import AsyncStorage from '@react-native-async-storage/async-storage';
export type MusicMode = 'online' | 'offline';
const MODE_KEY = 'music-app-mode-v1';
export async function loadMusicMode(): Promise<MusicMode> {
  return (await AsyncStorage.getItem(MODE_KEY)) === 'offline' ? 'offline' : 'online';
}
export async function saveMusicMode(mode: MusicMode) { await AsyncStorage.setItem(MODE_KEY, mode); }
