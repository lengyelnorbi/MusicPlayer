
import React, { useEffect, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import {
  useAudioPlayer,
  useAudioPlayerStatus,
  setAudioModeAsync,
} from "expo-audio";

import { usePlayback } from "@/context/PlaybackContext";
import { streamMusicByID } from "@/services/musicService";
import { audioPlayerStyles as styles } from "@/components/styles/AudioPlayer.styles";

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

export default function AudioPlayer() {
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);

  const {
    currentTrack,
    currentIndex,
    queue,
    sourceMode,
    shuffle,
    repeat,
    muted,
    setShuffle,
    setRepeat,
    setMuted,
    nextTrack,
    previousTrack,
    playQueueTrack,
  } = usePlayback();

  const [queueVisible, setQueueVisible] = useState(false);
  const [playerError, setPlayerError] = useState("");
  const lastLoadedSource = useRef<string | null>(null);
  const handledFinish = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function loadTrack() {
      if (!currentTrack) {
        player.pause();
        lastLoadedSource.current = null;
        return;
      }

      const uri =
        sourceMode === "offline"
          ? currentTrack.fileUri
          : streamMusicByID(currentTrack.id);

      if (!uri) {
        setPlayerError("This track is not available for playback.");
        return;
      }

      if (lastLoadedSource.current === uri) return;

      setPlayerError("");

      try {
        await player.replace({ uri });

        if (cancelled) return;

        lastLoadedSource.current = uri;
        player.volume = muted ? 0 : 1;
        player.play();
      } catch (error) {
        if (!cancelled) {
          setPlayerError(
            error instanceof Error
              ? error.message
              : "Could not play this track.",
          );
        }
      }
    }

    void loadTrack();

    return () => {
      cancelled = true;
    };
  }, [currentTrack?.id, currentTrack?.fileUri, sourceMode, player]);

  useEffect(() => {
    player.volume = muted ? 0 : 1;
  }, [muted, player]);

  useEffect(() => {
    if (!status.didJustFinish) {
      handledFinish.current = false;
      return;
    }

    if (handledFinish.current) return;
    handledFinish.current = true;

    if (repeat === "one") {
      void player.seekTo(0).then(() => player.play());
    } else {
      void nextTrack();
    }
  }, [status.didJustFinish, repeat, nextTrack, player]);

  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: "doNotMix",
    }).catch((error) => {
      console.error("Failed to configure background audio:", error);
    });
  }, []);

  useEffect(() => {
    if (!currentTrack) {
      player.clearLockScreenControls();
      return;
    }

    player.setActiveForLockScreen(
      true,
      {
        title: currentTrack.title,
      },
      {
       showSeekForward: false,
       showSeekBackward: false,
       isLiveStream: false,
      },
    );
  }, [currentTrack?.id, currentTrack?.title, player]);

//   useEffect(() => {
//   let cancelled = false;

//   const activateLockScreen = async () => {
//     try {
//       await setAudioModeAsync({
//         playsInSilentMode: true,
//         shouldPlayInBackground: true,
//         interruptionMode: "doNotMix",
//       });

//       if (cancelled) return;

//       if (!currentTrack) {
//         player.clearLockScreenControls();
//         return;
//       }

//       player.setActiveForLockScreen(
//         true,
//         {
//           title: currentTrack.title,
//           artist: "My Music",
//         },
//         {
//           isLiveStream: false,
//           showSeekForward: false,
//           showSeekBackward: false,
//           showNextTrack: true,
//           showPreviousTrack: true,
//         },
//       );
//     } catch (error) {
//       console.error("Lock-screen setup failed:", error);
//     }
//   };

//   void activateLockScreen();

//   return () => {
//     cancelled = true;
//   };
// }, [currentTrack?.id, currentTrack?.title, player]);

//   useEffect(() => {
//   const nextSubscription = player.addListener(
//     "onRemoteNextTrack",
//     () => {
//       void nextTrack();
//     },
//   );

//   const previousSubscription = player.addListener(
//     "onRemotePreviousTrack",
//     () => {
//       void previousTrack();
//     },
//   );

  
  if (!currentTrack) return null;

  const duration = status.duration ?? 0;
  const currentTime = status.currentTime ?? 0;
  const progress =
    duration > 0 ? Math.min(1, currentTime / duration) : 0;

  const togglePlay = () => {
    if (status.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  const cycleRepeat = () => {
    setRepeat(
      repeat === "off" ? "all" : repeat === "all" ? "one" : "off",
    );
  };

  return (
    <View style={styles.panel}>
      <View style={styles.trackRow}>
        <View style={styles.art}>
          <Text style={styles.artNote}>♫</Text>
        </View>

        <View style={styles.trackInfo}>
          <Text numberOfLines={1} style={styles.trackTitle}>
            {currentTrack.title}
          </Text>
          <Text style={styles.subtitle}>
            Track {currentIndex + 1} of {queue.length}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={muted ? "Unmute" : "Mute"}
          onPress={() => setMuted(!muted)}
          style={styles.smallButton}
        >
          <Text style={styles.controlText}>{muted ? "🔇" : "🔊"}</Text>
        </Pressable>
      </View>

      {!!playerError && (
        <Text accessibilityRole="alert" style={styles.error}>
          {playerError}
        </Text>
      )}

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${progress * 100}%` },
          ]}
        />
      </View>

      <View style={styles.timeRow}>
        <Text style={styles.time}>{formatTime(currentTime)}</Text>
        <Text style={styles.time}>{formatTime(duration)}</Text>
      </View>

      <View style={styles.controls}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Toggle shuffle"
          onPress={() => setShuffle(!shuffle)}
          style={styles.smallButton}
        >
          <Text style={[styles.controlText, shuffle && styles.active]}>
            ⤨
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous track"
          onPress={() => void previousTrack()}
          style={styles.controlButton}
        >
          <Text style={styles.controlText}>⏮</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={status.playing ? "Pause" : "Play"}
          onPress={togglePlay}
          style={styles.playButton}
        >
          <Text style={styles.playText}>
            {status.playing ? "Ⅱ" : "▶"}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next track"
          onPress={() => void nextTrack()}
          style={styles.controlButton}
        >
          <Text style={styles.controlText}>⏭</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Repeat ${repeat}`}
          onPress={cycleRepeat}
          style={styles.smallButton}
        >
          <Text style={[styles.controlText, repeat !== "off" && styles.active]}>
            {repeat === "one" ? "↻¹" : "↻"}
          </Text>
        </Pressable>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={queueVisible ? "Hide playback queue" : "Show playback queue"}
        style={styles.queueToggle}
        onPress={() => setQueueVisible((value) => !value)}
      >
        <Text style={styles.queueToggleText}>
          {queueVisible ? "Hide queue ▲" : `Show queue (${queue.length}) ▼`}
        </Text>
      </Pressable>

      {queueVisible && (
        <ScrollView
          style={styles.queueList}
          nestedScrollEnabled
          showsVerticalScrollIndicator
          keyboardShouldPersistTaps="handled"
        >
          {queue.map((track, index) => (
            <Pressable
              key={`${track.id}-${index}`}
              accessibilityRole="button"
              accessibilityLabel={`Play ${track.title}`}
              onPress={() => void playQueueTrack(index)}
              style={styles.queueItem}
            >
              <Text
                numberOfLines={1}
                style={[
                  styles.queueTitle,
                  index === currentIndex && styles.active,
                ]}
              >
                {index === currentIndex ? "♫  " : ""}
                {track.title}
              </Text>

              <Text style={styles.queueNumber}>{index + 1}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
