import React, { useEffect, useRef } from "react";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";

type AudioPlayerProps = {
  url: string | null;
  onError?: (error: unknown) => void;
};

export default function AudioPlayer({ url, onError }: AudioPlayerProps) {
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const lastReportedError = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    lastReportedError.current = null;

    if (!url) {
      player.pause();
      return () => { cancelled = true; };
    }

    const startPlayback = async () => {
      try {
        await player.replace({ uri: url });
        if (!cancelled) player.play();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        lastReportedError.current = message;
        onError?.(error);
      }
    };

    void startPlayback();
    return () => { cancelled = true; };
  }, [url, player, onError]);

  useEffect(() => {
    const message = status.error ? String(status.error) : null;
    if (!message) {
      lastReportedError.current = null;
      return;
    }
    if (message !== lastReportedError.current) {
      lastReportedError.current = message;
      onError?.(new Error(message));
    }
  }, [status.error, onError]);

  return null;
}
