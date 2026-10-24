import { Alert, Pressable, Text, View } from "react-native";

import { importExistingMusic } from "@/services/offlineLibrary";
import { actionButtonStyles as styles } from "@/components/styles/ActionButton.styles";

export default function ImportMusicFromPhoneButton() {
  const handleImportMusic = async () => {
    try {
      const result = await importExistingMusic();

      Alert.alert(
        "Import complete",
        `Imported: ${result.imported}\nSkipped: ${result.skipped.length}` +
          (result.skipped.length
            ? `\n\nUnmatched files:\n${result.skipped.slice(0, 5).join("\n")}`
            : ""),
      );
    } catch (error) {
      Alert.alert(
        "Import failed",
        error instanceof Error ? error.message : "Could not import music.",
      );
    }
  };

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        onPress={() => void handleImportMusic()}
        style={({ pressed }) => [
          styles.button,
          styles.buttonDisabled,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.buttonText}>Import music from phone</Text>
      </Pressable>
    </View>
  );
}