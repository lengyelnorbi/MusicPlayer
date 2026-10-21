import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from "react-native";

import { createLocalMusicDatabase } from "@/services/sqliteExport";
import { colors } from "@/theme";
import { actionButtonStyles as styles } from "@/components/styles/ActionButton.styles";

export default function CreateSqliteDatabaseButton() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const handleCreate = async () => {
    if (busy) return;

    setBusy(true);
    setMessage("");
    setIsError(false);

    try {
      const result = await createLocalMusicDatabase();
      const total = Object.values(result.counts).reduce(
        (sum, count) => sum + count,
        0,
      );

      setMessage(
        `SQLite database updated on this device. ${total} records copied.\n` +
          Object.entries(result.counts)
            .map(([table, count]) => `${table}: ${count}`)
            .join(" · "),
      );
    } catch (error) {
      setIsError(true);
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not create the SQLite database.",
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
        onPress={() => void handleCreate()}
        style={({ pressed }) => [
          styles.button,
          pressed && !busy && styles.pressed,
          busy && styles.buttonDisabled,
        ]}
      >
        {busy ? (
          <ActivityIndicator color={colors.text} />
        ) : (
          <Text style={styles.buttonText}>Sync local database</Text>
        )}
      </Pressable>

      {!!message && (
        <Text
          accessibilityLiveRegion="polite"
          style={[
            styles.message,
            isError ? styles.errorMessage : styles.successMessage,
          ]}
        >
          {message}
        </Text>
      )}
    </View>
  );
}