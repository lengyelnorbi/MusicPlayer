
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { Music } from "@/types/music";
import type { MusicMode } from "@/services/appPreferences";
import { getMusicList } from "@/services/musicService";
import { getOfflineTracks, getOfflineTrackUri } from "@/services/offlineLibrary";

export type RepeatMode = "off" | "one" | "all";

type PlaybackContextValue = {
  queue: Music[];
  currentTrack: Music | null;
  currentIndex: number;
  sourceMode: MusicMode;
  queueTitle: string;
  shuffle: boolean;
  repeat: RepeatMode;
  muted: boolean;
  setShuffle: (value: boolean) => void;
  setRepeat: (value: RepeatMode) => void;
  setMuted: (value: boolean) => void;
  playCatalogueTrack: (track: Music, mode: MusicMode) => Promise<void>;
  playPlaylist: (
    tracks: Music[],
    selected: Music,
    mode: MusicMode,
    title: string,
  ) => Promise<void>;
  playQueueTrack: (index: number) => Promise<void>;
  nextTrack: (fromRemoteControl?: boolean) => Promise<void>;
  previousTrack: () => Promise<void>;
  syncCurrentIndex: (index: number) => void;
};

const PlaybackContext = createContext<PlaybackContextValue | null>(null);

async function getFullCatalogue(): Promise<Music[]> {
  const firstPage = await getMusicList(1, 100, "", []);
  const all = [...firstPage.items];

  for (let page = 2; page <= firstPage.totalPages; page++) {
    const result = await getMusicList(page, 100, "", []);
    all.push(...result.items);
  }

  return all;
}

async function prepareTrack(track: Music, mode: MusicMode): Promise<Music> {
  if (mode !== "offline") return track;

  const fileUri = track.fileUri ?? await getOfflineTrackUri(track.id);
  if (!fileUri) {
    throw new Error(`"${track.title}" is not downloaded for offline playback.`);
  }

  return { ...track, fileUri };
}

export function PlaybackProvider({ children }: React.PropsWithChildren) {
  const [queue, setQueue] = useState<Music[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [sourceMode, setSourceMode] = useState<MusicMode>("online");
  const [queueTitle, setQueueTitle] = useState("All music");
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>("off");
  const [muted, setMuted] = useState(false);

  const currentTrack = currentIndex >= 0 ? queue[currentIndex] ?? null : null;

  const playQueueTrack = useCallback(async (index: number) => {
    if (index < 0 || index >= queue.length) return;
    const track = await prepareTrack(queue[index], sourceMode);
    setQueue(current => current.map((item, i) => i === index ? track : item));
    setCurrentIndex(index);
  }, [queue, sourceMode]);

  const playCatalogueTrack = useCallback(async (track: Music, mode: MusicMode) => {
    const catalogue = mode === "offline"
      ? (await getOfflineTracks()).map(item => ({
          ...item,
          genre: item.genre ?? "",
          addedAt: item.addedAt ?? "",
        }))
      : await getFullCatalogue();

    const selectedIndex = catalogue.findIndex(item => item.id === track.id);
    const selected = await prepareTrack(track, mode);

    const nextQueue = [...catalogue];
    if (selectedIndex >= 0) nextQueue[selectedIndex] = selected;
    else {
      nextQueue.push(selected);
    }

    setQueue(nextQueue);
    setCurrentIndex(selectedIndex >= 0 ? selectedIndex : nextQueue.length - 1);
    setSourceMode(mode);
    setQueueTitle("All music");
  }, []);

  const playPlaylist = useCallback(async (
    tracks: Music[],
    selected: Music,
    mode: MusicMode,
    title: string,
  ) => {
    const selectedIndex = tracks.findIndex(item => item.id === selected.id);
    const index = selectedIndex >= 0 ? selectedIndex : 0;
    const prepared = await prepareTrack(tracks[index], mode);
    const nextQueue = [...tracks];
    nextQueue[index] = prepared;

    setQueue(nextQueue);
    setCurrentIndex(index);
    setSourceMode(mode);
    setQueueTitle(title);
  }, []);

  const nextTrack = useCallback(async (fromRemoteControl = false) => {
    if (!queue.length) return;

    if (currentIndex < 0) {
      if (fromRemoteControl) await playQueueTrack(0);
      return;
    }

    if (repeat === "one") {
      // AudioPlayer handles restarting the current track.
      return;
    }

    if (shuffle && queue.length > 1) {
      const choices = queue.map((_, i) => i).filter(i => i !== currentIndex);
      await playQueueTrack(choices[Math.floor(Math.random() * choices.length)]);
      return;
    }

    const next = currentIndex + 1;
    if (next < queue.length) {
      await playQueueTrack(next);
    } else if (repeat === "all") {
      await playQueueTrack(0);
    } else if (fromRemoteControl) {
      // With repeat off, playback stops at the end but Next starts the queue
      // again instead of requiring the user to reopen the queue.
      await playQueueTrack(0);
    }
  }, [queue, currentIndex, repeat, shuffle, playQueueTrack]);

  const previousTrack = useCallback(async () => {
    if (!queue.length || currentIndex < 0) return;
    await playQueueTrack(currentIndex > 0 ? currentIndex - 1 : queue.length - 1);
  }, [queue, currentIndex, playQueueTrack]);

  const syncCurrentIndex = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const value = useMemo(() => ({
    queue,
    currentTrack,
    currentIndex,
    sourceMode,
    queueTitle,
    shuffle,
    repeat,
    muted,
    setShuffle,
    setRepeat,
    setMuted,
    playCatalogueTrack,
    playPlaylist,
    playQueueTrack,
    nextTrack,
    previousTrack,
    syncCurrentIndex,
  }), [
    queue, currentTrack, currentIndex, sourceMode, queueTitle,
    shuffle, repeat, muted, playCatalogueTrack, playPlaylist,
    playQueueTrack, nextTrack, previousTrack, syncCurrentIndex,
  ]);

  return (
    <PlaybackContext.Provider value={value}>
      {children}
    </PlaybackContext.Provider>
  );
}

export function usePlayback() {
  const value = useContext(PlaybackContext);
  if (!value) {
    throw new Error("usePlayback must be used inside PlaybackProvider");
  }
  return value;
}
