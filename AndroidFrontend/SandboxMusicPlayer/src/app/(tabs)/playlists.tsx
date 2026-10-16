import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useMusicApp } from "@/context/MusicAppContext";
import { createPlaylist, getUserPlaylists } from "@/services/playlistService";
import type { Playlist } from "@/types/playlist";

function getSessionUserId(user: Record<string, unknown> | undefined): number | null {
  const raw = user?.id ?? user?.ID;
  const id = typeof raw === "number" ? raw : Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export default function PlaylistsScreen() {
  const router = useRouter();
  const { session } = useMusicApp();
  const [items, setItems] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const userId = getSessionUserId(session?.user as Record<string, unknown> | undefined);

  const loadPlaylists = useCallback(async () => {
    if (!session || !userId) {
      setItems([]);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const result = await getUserPlaylists(userId, 1, 100);
      setItems(Array.isArray(result.items) ? result.items : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load playlists.");
    } finally {
      setLoading(false);
    }
  }, [session, userId]);

  useEffect(() => {
    void loadPlaylists();
  }, [loadPlaylists]);

  async function create() {
    const value = name.trim();
    if (!value) {
      Alert.alert("Playlist name required", "Enter a name first.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await createPlaylist(value);
      setName("");
      setCreating(false);
      await loadPlaylists();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create playlist.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.root}>
      <View style={styles.heading}>
        <View style={styles.headingText}>
          <Text style={styles.title}>Your playlists</Text>
          <Text style={styles.subtitle}>Collections for every mood</Text>
        </View>
        {session && <Pressable style={styles.add} onPress={() => setCreating(v => !v)}>
          <Text style={styles.addText}>{creating ? "Cancel" : "+ New"}</Text>
        </Pressable>}
      </View>

      {!session ? (
        <View style={styles.empty}>
          <Text style={styles.emptyArt}>♫</Text>
          <Text style={styles.emptyTitle}>Sign in to manage playlists</Text>
          <Text style={styles.subtitle}>Your playlists are stored with your account.</Text>
          <Pressable style={styles.create} onPress={() => router.push("/login")}>
            <Text style={styles.createText}>Sign in</Text>
          </Pressable>
        </View>
      ) : (
        <>
          {creating && <View style={styles.form}>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Playlist name"
              placeholderTextColor="#858397"
              style={styles.input}
              autoFocus
              editable={!saving}
              returnKeyType="done"
              onSubmitEditing={() => void create()}
            />
            <Pressable disabled={saving} style={[styles.create, saving && styles.disabled]} onPress={() => void create()}>
              <Text style={styles.createText}>{saving ? "Creating…" : "Create playlist"}</Text>
            </Pressable>
          </View>}
          {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
          {loading && <ActivityIndicator color="#c4b5fd" style={{ marginVertical: 16 }} />}
          <FlatList
            data={items}
            keyExtractor={(item, index) => String(item.id ?? index)}
            contentContainerStyle={items.length ? styles.list : styles.emptyWrap}
            refreshing={loading}
            onRefresh={() => void loadPlaylists()}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.art}><Text style={styles.artText}>♫</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.playlistName}>{item.name}</Text>
                  <Text style={styles.subtitle}>{item.musicCount ?? 0} songs</Text>
                </View>
              </View>
            )}
            ListEmptyComponent={!loading && !error ? (
              <View style={styles.empty}>
                <Text style={styles.emptyArt}>♫</Text>
                <Text style={styles.emptyTitle}>No playlists yet</Text>
                <Text style={styles.subtitle}>Create a playlist to collect songs you love.</Text>
                <Pressable style={styles.create} onPress={() => setCreating(true)}>
                  <Text style={styles.createText}>Create your first playlist</Text>
                </Pressable>
              </View>
            ) : null}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0b0b12", padding: 20 },
  heading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 },
  headingText: { flex: 1 },
  title: { color: "#fff", fontSize: 27, fontWeight: "900" },
  subtitle: { color: "#9996ab", fontSize: 13, marginTop: 5 },
  add: { backgroundColor: "#7c3aed", paddingVertical: 11, paddingHorizontal: 15, borderRadius: 12 },
  addText: { color: "#fff", fontWeight: "800" },
  form: { backgroundColor: "#171622", padding: 14, borderRadius: 16, marginBottom: 18, gap: 10 },
  input: { color: "#fff", backgroundColor: "#0b0b12", borderWidth: 1, borderColor: "#302943", padding: 13, borderRadius: 10 },
  create: { backgroundColor: "#6d28d9", borderRadius: 12, paddingVertical: 13, paddingHorizontal: 16, alignItems: "center", marginTop: 10 },
  createText: { color: "#fff", fontWeight: "800" },
  disabled: { opacity: 0.6 },
  error: { color: "#fca5a5", backgroundColor: "#35191e", borderRadius: 10, padding: 12, marginBottom: 12 },
  list: { gap: 12, paddingBottom: 20 },
  card: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: "#171622", padding: 12, borderRadius: 16, borderWidth: 1, borderColor: "#252033" },
  art: { width: 58, height: 58, backgroundColor: "#392957", borderRadius: 12, alignItems: "center", justifyContent: "center" },
  artText: { color: "#ddd6fe", fontSize: 30 },
  playlistName: { color: "#fff", fontSize: 16, fontWeight: "800" },
  emptyWrap: { flexGrow: 1, justifyContent: "center" },
  empty: { alignItems: "center", paddingHorizontal: 20 },
  emptyArt: { color: "#c4b5fd", fontSize: 58, marginBottom: 14 },
  emptyTitle: { color: "#fff", fontSize: 20, fontWeight: "900", textAlign: "center" },
});
