
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import { useMusicApp } from "@/context/MusicAppContext";
import { usePlayback } from "@/context/PlaybackContext";
import {
  createPlaylist,
  getPlaylistByID,
  getUserPlaylists,
} from "@/services/playlistService";
import { getDownloadedTracksForPlaylist } from "@/services/offlineLibrary";
import type { Playlist } from "@/types/playlist";
import type { Music } from "@/types/music";
import { playlistScreenStyles as styles } from "@/components/styles/PlaylistScreen.styles";

function getSessionUserId(
  user: Record<string, unknown> | undefined,
): number | null {
  const raw = user?.id ?? user?.ID;
  const id = typeof raw === "number" ? raw : Number(raw);

  return Number.isInteger(id) && id > 0 ? id : null;
}

export default function PlaylistScreen() {
  const router = useRouter();
  const { session, mode } = useMusicApp();
  const { playPlaylist } = usePlayback();

  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const userId = getSessionUserId(
    session?.user as Record<string, unknown> | undefined,
  );

  const loadPlaylists = useCallback(async () => {
    if (!session || !userId) {
      setPlaylists([]);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await getUserPlaylists(userId, 1, 100);
      setPlaylists(result.items ?? []);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not load playlists.",
      );
    } finally {
      setLoading(false);
    }
  }, [session, userId]);

  useEffect(() => {
    void loadPlaylists();
  }, [loadPlaylists]);

  const handleCreate = async () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      Alert.alert("Playlist name required", "Enter a name first.");
      return;
    }

    setSaving(true);

    try {
      await createPlaylist(trimmedName);
      setName("");
      setCreating(false);
      await loadPlaylists();
    } catch (cause) {
      Alert.alert(
        "Could not create playlist",
        cause instanceof Error ? cause.message : "Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handlePlay = async (playlist: Playlist) => {
    try {
      let tracks: Music[];

      if (mode === "offline") {
        const downloaded = await getDownloadedTracksForPlaylist(playlist.id);

        tracks = downloaded.map((track) => ({
          ...track,
          genre: track.genre ?? "",
          addedAt: track.addedAt ?? "",
        }));
      } else {
        const details = await getPlaylistByID(playlist.id);
        tracks = details.musics ?? [];
      }

      if (!tracks.length) {
        Alert.alert(
          "No playable tracks",
          "This playlist has no available tracks in the current mode.",
        );
        return;
      }

      await playPlaylist(tracks, tracks[0], mode, playlist.name);
    } catch (cause) {
      Alert.alert(
        "Playback failed",
        cause instanceof Error ? cause.message : "Could not load this playlist.",
      );
    }
  };

  if (!session) {
    return (
      <View style={styles.root}>
        <Text style={styles.title}>Your playlists</Text>

        <View style={styles.empty}>
          <Text style={styles.musicNote}>♫</Text>
          <Text style={styles.emptyTitle}>Sign in to view playlists</Text>
          <Text style={styles.emptyDescription}>
            Your playlists are linked to your account.
          </Text>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/login")}
            style={styles.primaryButton}
          >
            <Text style={styles.buttonText}>Sign in</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.heading}>
        <View style={styles.headingContent}>
          <Text style={styles.title}>Your playlists</Text>
          <Text style={styles.subtitle}>Collections for every mood</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => setCreating((value) => !value)}
          style={styles.primaryButton}
        >
          <Text style={styles.buttonText}>
            {creating ? "Cancel" : "+ New"}
          </Text>
        </Pressable>
      </View>

      {creating && (
        <View style={styles.createPanel}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Playlist name"
            placeholderTextColor="#858397"
            style={styles.input}
            editable={!saving}
            returnKeyType="done"
            onSubmitEditing={() => void handleCreate()}
          />

          <Pressable
            accessibilityRole="button"
            disabled={saving}
            style={[
              styles.primaryButton,
              saving && styles.buttonDisabled,
            ]}
            onPress={() => void handleCreate()}
          >
            <Text style={styles.buttonText}>
              {saving ? "Creating..." : "Create playlist"}
            </Text>
          </Pressable>
        </View>
      )}

      {!!error && (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      )}

      {loading ? (
        <ActivityIndicator
          color="#c4b5fd"
          style={styles.loading}
        />
      ) : (
        <FlatList
          data={playlists}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          onRefresh={() => void loadPlaylists()}
          refreshing={loading}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => void handlePlay(item)}
              accessibilityRole="button"
              accessibilityLabel={`Play playlist ${item.name}`}
            >
              <View style={styles.art}>
                <Text style={styles.artText}>♫</Text>
              </View>

              <View style={styles.headingContent}>
                <Text style={styles.playlistName}>{item.name}</Text>
                <Text style={styles.subtitle}>
                  {item.musicCount ?? item.musics?.length ?? 0} songs
                </Text>
              </View>

              <Text style={styles.playIcon}>▶</Text>
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.musicNote}>♫</Text>
              <Text style={styles.emptyTitle}>No playlists yet</Text>
              <Text style={styles.emptyDescription}>
                Create a playlist to collect songs you love.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
