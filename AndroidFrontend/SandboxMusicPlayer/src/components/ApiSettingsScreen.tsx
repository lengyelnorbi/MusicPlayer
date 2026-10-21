
import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import {
  getApiBaseUrl,
  loadApiBaseUrl,
  saveApiBaseUrl,
  resetApiBaseUrl,
} from "@/services/apiConfig";
import { useMusicApp } from "@/context/MusicAppContext";
import { apiSettingsStyles as styles } from "@/components/styles/ApiSettingsScreen.styles";

import ImportMusicFromPhoneButton from "./ImportMusicFromPhoneButton";
import CreateSqliteDatabaseButton from "./CreateSqliteDatabaseButton";
import DownloadAllMusicButton from "./DownloadAllMusicButton";

export default function ApiSettingsScreen() {
  const router = useRouter();
  const [url, setUrl] = useState(getApiBaseUrl());
  const [saving, setSaving] = useState(false);
  const { session } = useMusicApp();

  useEffect(() => {
    loadApiBaseUrl()
      .then(setUrl)
      .catch(() => {
        Alert.alert("Error", "Could not load the API URL.");
      });
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);

      const savedUrl = await saveApiBaseUrl(url);
      setUrl(savedUrl);

      Alert.alert(
        "Saved",
        "API URL updated. Reload any screens that need fresh data.",
      );
    } catch (error) {
      Alert.alert(
        "Invalid URL",
        error instanceof Error ? error.message : "Could not save the URL.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      const defaultUrl = await resetApiBaseUrl();
      setUrl(defaultUrl);
      Alert.alert("Reset", "The default API URL has been restored.");
    } catch {
      Alert.alert("Error", "Could not reset the API URL.");
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.top}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
        >
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>API Server</Text>

        <Text style={styles.label}>Base URL</Text>

        <TextInput
          value={url}
          onChangeText={setUrl}
          placeholder="http://192.168.1.10:5000"
          placeholderTextColor="#858397"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          editable={!saving}
          style={styles.input}
        />

        <Button
          title={saving ? "Saving..." : "Save URL"}
          onPress={() => void handleSave()}
          disabled={saving}
        />

        <Button
          title="Restore Default"
          onPress={() => void handleReset()}
          disabled={saving}
        />

        {session && (
          <>
            <View style={styles.separator} />

            <Text style={styles.section}>LOCAL DATA</Text>

            <CreateSqliteDatabaseButton />
            <DownloadAllMusicButton />
            <ImportMusicFromPhoneButton />
          </>
        )}
      </View>
    </View>
  );
}
