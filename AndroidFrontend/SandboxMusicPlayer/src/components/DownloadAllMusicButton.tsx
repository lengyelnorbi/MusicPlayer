import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from "react-native";

import {
  downloadAllMusicForOfflineUse,
  type DownloadProgress,
} from "@/services/downloadService";
import { colors } from "@/theme";
import { actionButtonStyles as styles } from "@/components/styles/ActionButton.styles";

export default function DownloadAllMusicButton() {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const handleDownload = async () => {
    if (busy) return;

    setBusy(true);
    setProgress(null);
    setMessage("");
    setIsError(false);

    try {
      const total = await downloadAllMusicForOfflineUse(setProgress);

      setMessage(
        `Successfully downloaded ${total} music tracks. ` +
          "Your offline library is ready.",
      );
    } catch (error) {
      setIsError(true);
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not download the music library.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        disabled={busy}
        onPress={() => void handleDownload()}
        style={({ pressed }) => [
          styles.button,
          pressed && !busy && styles.pressed,
          busy && styles.buttonDisabled,
        ]}
      >
        {busy ? (
          <ActivityIndicator color={colors.text} />
        ) : (
          <Text style={styles.buttonText}>
            Download all music for offline use
          </Text>
        )}
      </Pressable>

      {busy && progress && (
        <Text style={styles.message}>
          Downloading {progress.completed} of {progress.total}
          {"\n"}
          {progress.currentTitle}
        </Text>
      )}

      {!!message && (
        <Text
          accessibilityLiveRegion="polite"
          style={[
            styles.message,
            isError && styles.errorMessage,
            !isError && styles.successMessage,
          ]}
        >
          {message}
          {isError && progress
            ? ` (${progress.completed} tracks completed)`
            : ""}
        </Text>
      )}
    </View>
  );
}