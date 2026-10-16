import React, { useCallback, useState } from "react";
import { Alert, View } from "react-native";
import MusicListScreen from "../../components/MusicListScreen";
import AudioPlayer from "@/components/AudioPlayer";
import { useMusicApp } from "@/context/MusicAppContext";
import type { Music } from "@/types/music";
import { getOfflineTrackUri } from "@/services/offlineLibrary";
import { streamMusicByID } from "@/services/musicService";

export default function MusicsRoute() {
  const { mode, session } = useMusicApp();
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);

  const play = useCallback(async (music: Music) => {
    try {
      if (mode === "offline") {
        const localUri = music.fileUri ?? await getOfflineTrackUri(music.id);
        if (!localUri) {
          Alert.alert("Track unavailable", "This song is not downloaded for offline playback.");
          return;
        }
        setPlaybackUrl(localUri);
      } else {
        setPlaybackUrl(streamMusicByID(music.id));
      }
    } catch (error) {
      Alert.alert(
        "Playback failed",
        error instanceof Error ? error.message : "Unable to start playback.",
      );
    }
  }, [mode]);

  const handlePlaybackError = useCallback((error: unknown) => {
    Alert.alert("Playback error", error instanceof Error ? error.message : "The track could not be played.");
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "#0b0b12" }}>
      <MusicListScreen
        mode={mode}
        loggedIn={!!session}
        onPlayMusic={play}
      />
      <AudioPlayer url={playbackUrl} onError={handlePlaybackError} />
    </View>
  );
}
