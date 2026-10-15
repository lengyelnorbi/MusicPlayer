import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { Music } from "@/types/music";
import type { Playlist } from "@/types/playlist";
import { getMusicList, downloadMusic, addMusicToPlaylist,removeMusicFromPlaylist  } from "../services/musicService";
import { createPlaylist } from "../services/playlistService";

type Props = {
  loggedIn?: boolean;
  // Connect these to your existing app-level audio/auth/upload/favorites logic.
  onPlayMusic?: (music: Music, currentList: Music[]) => void;
  onRequestMusic?: (youtubeUrl: string) => Promise<void>;
  onDownloadMusic?: (musicID: number, url: string) => void;
  onAddToFavorites?: (musicID: number) => void;
};

type PageItem = number | "ellipsis";

export default function MusicListScreen({
  loggedIn = false,
  onPlayMusic,
  onRequestMusic,
  onDownloadMusic,
  onAddToFavorites,
}: Props) {
  const [musics, setMusics] = useState<Music[]>([]);
  const [musicList, setMusicList] = useState<Music[]>([]);
  const [availableGenres, setAvailableGenres] = useState<string[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [maxItemCount, setMaxItemCount] = useState(0);
  const [maxPageCount, setMaxPageCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeMusicId, setActiveMusicId] = useState<number | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [showPlaylistOverlay, setShowPlaylistOverlay] = useState(false);
  const [selectedMusicID, setSelectedMusicID] = useState<number | null>(null);
  const [userPlaylists, setUserPlaylists] = useState<Playlist[]>([]);
  const [selectedMusicPlaylistIds, setSelectedMusicPlaylistIds] = useState<number[]>([]);
  const [showNewPlaylistInput, setShowNewPlaylistInput] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [requestUrl, setRequestUrl] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [showAllGenres, setShowAllGenres] = useState(false);
  const visibleGenres = showAllGenres ? availableGenres : availableGenres.slice(0, 5);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 2000);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadMusic = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getMusicList(currentPage, limit, debouncedSearch, selectedGenres);
      setMusics(result.items ?? []);
      setMusicList(result.items ?? []);
      setMaxItemCount(result.totalItemCount ?? 0);
      setMaxPageCount(result.totalPages ?? 0);
      setAvailableGenres(result.availableGenres ?? []);
      setUserPlaylists(result.userPlaylists ?? []);
    } finally {
      setLoading(false);
    }
  }, [currentPage, limit, debouncedSearch, selectedGenres]);

  useEffect(() => {
    void loadMusic();
  }, [loadMusic]);

  const paginationItems = useMemo<PageItem[]>(() => {
    if (maxPageCount <= 5) {
      return Array.from({ length: maxPageCount }, (_, i) => i + 1);
    }

    let pages: number[];

    if (currentPage <= 3) {
      // Near the beginning
      pages = [1, 2, 3, -1, maxPageCount];
    } else if (currentPage >= maxPageCount - 2) {
      // Near the end
      pages = [
        1,
        -1,
        maxPageCount - 2,
        maxPageCount - 1,
        maxPageCount,
      ];
    } else {
      // In the middle
      pages = [
        1,
        -1,
        currentPage - 1,
        currentPage,
        currentPage + 1,
        -1,
        maxPageCount,
      ];
    }

    return pages.map((page) =>
      page === -1 ? "ellipsis" : page
    );
  }, [currentPage, maxPageCount]);

  const toggleGenre = (genre: string) => {
    setSelectedGenres((old) =>
      old.includes(genre) ? old.filter((g) => g !== genre) : [...old, genre]
    );
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setSelectedGenres([]);
    setCurrentPage(1);
  };

  const saveOrRemoveMusicToPlaylist = async (playlistID: number) => {
    if (selectedMusicID == null) return;
    const currentlySelected = selectedMusicPlaylistIds.includes(playlistID);
    try {
      const ok = currentlySelected
        ? await removeMusicFromPlaylist(playlistID, selectedMusicID)
        : await addMusicToPlaylist(playlistID, selectedMusicID);
      if (!ok) throw new Error("Playlist update failed");
      setSelectedMusicPlaylistIds((ids) =>
        currentlySelected ? ids.filter((id) => id !== playlistID) : [...new Set([...ids, playlistID])]
      );
    } catch (error) {
      console.error("Could not update playlist:", error);
    }
  };

  const openSaveOverlay = (music: Music) => {
    setSelectedMusicID(music.id);
    setSelectedMusicPlaylistIds(music.playlistIDs ?? []);
    setOpenMenuId(null);
    setShowPlaylistOverlay(true);
  };

  const submitPlaylist = async () => {
    const name = newPlaylistName.trim();
    if (!name) return;
    try {
      await createPlaylist(name);
      setNewPlaylistName("");
      setShowNewPlaylistInput(false);
      await loadMusic();
    } catch (error) {
      console.error("Could not create playlist:", error);
    }
  };

  const submitRequest = async () => {
    if (!loggedIn || !requestUrl.trim() || !onRequestMusic) return;
    setRequestLoading(true);
    setRequestMessage("");
    try {
      await onRequestMusic(requestUrl.trim());
      setRequestUrl("");
      setRequestMessage("Music request sent to the administrator.");
    } catch {
      setRequestMessage("Could not send the music request.");
    } finally {
      setRequestLoading(false);
    }
  };

  const closeOverlay = () => {
    setShowPlaylistOverlay(false);
    setSelectedMusicID(null);
    setShowNewPlaylistInput(false);
    setNewPlaylistName("");
  };

  const renderMusic = ({ item }: { item: Music }) => {
    const active = activeMusicId === item.id;
    return (
      <View style={[styles.musicCard, active && styles.musicCardActive]}>
        <Pressable
          style={styles.musicInfo}
          onPress={() => {
            setActiveMusicId(item.id);
            setOpenMenuId(null);
            onPlayMusic?.(item, musicList);
          }}
        >
          <Text style={[styles.note, active && styles.pinkText]}>♫</Text>
          <View style={styles.musicText}>
            <Text numberOfLines={2} style={styles.musicTitle}>{item.title}</Text>
            {!!item.addedAt && <Text style={styles.muted}>{item.addedAt}</Text>}
            {!!item.genre && <Text style={styles.genre}>{item.genre}</Text>}
          </View>
        </Pressable>
        {loggedIn && (
          <View>
            <Pressable style={styles.menuTrigger} onPress={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}>
              <Text style={styles.menuDots}>⋮</Text>
            </Pressable>
            {openMenuId === item.id && (
              <View style={styles.dropdown}>
                <Pressable style={styles.menuItem} onPress={() => openSaveOverlay(item)}>
                  <Text style={styles.menuText}>＋ Save to playlist</Text>
                </Pressable>
                <Pressable
                  style={styles.menuItem}
                  onPress={async () => {
                    setOpenMenuId(null);
                    try {
                      const url = await downloadMusic(item.id);
                      if (onDownloadMusic) onDownloadMusic(item.id, url);
                      else console.info("Download URL:", url, "Install expo-file-system and expo-sharing to download natively.");
                    } catch (e) { console.error(e); }
                  }}
                >
                  <Text style={styles.menuText}>⇩ Download</Text>
                </Pressable>
                <Pressable style={styles.menuItem} onPress={() => { onAddToFavorites?.(item.id); setOpenMenuId(null); }}>
                  <Text style={styles.favoriteText}>♡ Add to favorites</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent} keyboardShouldPersistTaps="handled">
        <View style={styles.searchPanel}>
          <View style={styles.searchHeader}>
            <Text style={styles.sectionTitle}>COMPLEX SEARCH</Text>

            {(searchTerm || selectedGenres.length > 0) && (
              <Pressable style={styles.clearButton} onPress={clearFilters}>
                <Text style={styles.clearText}>Clear</Text>
              </Pressable>
            )}
          </View>
          <Text style={styles.label}>Title</Text>
          <TextInput
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder="Search music titles..."
            placeholderTextColor="#526887"
            style={styles.input}
            returnKeyType="search"
          />
          <Text style={styles.hint}>Search starts 2 seconds after typing stops.</Text>
          <Text style={[styles.label, { marginTop: 18 }]}>Genre</Text>
          {availableGenres.length > 0 ? (
            <>
            {visibleGenres.map((genre) => (
              <Pressable
                key={genre}
                style={styles.genreOption}
                onPress={() => toggleGenre(genre)}
              >
                <View
                  style={[
                    styles.checkbox,
                    selectedGenres.includes(genre) && styles.checkboxChecked,
                  ]}
                >
                  {selectedGenres.includes(genre) && (
                    <Text style={styles.checkboxTick}>✓</Text>
                  )}
                </View>

                <Text style={styles.genreOptionText}>{genre}</Text>
              </Pressable>
            ))}

            {availableGenres.length > 5 && (
              <Pressable
                onPress={() => setShowAllGenres((previous) => !previous)}
                style={styles.genreExpandButton}
              >
                <Text style={styles.genreExpandText}>
                  {showAllGenres
                    ? "Show less  ↑"
                    : `Show all ${availableGenres.length} genres  ↓`}
                </Text>
              </Pressable>
            )}
          </>
        ) : (
          <Text style={styles.hint}>No genres have been assigned yet.</Text>
        )}
        </View>

        {loggedIn && (
          <View style={styles.requestPanel}>
            <Text style={styles.requestTitle}>Request a music upload</Text>
            <Text style={styles.hint}>Send a YouTube URL and the administrator can add it to the library.</Text>
            <TextInput
              value={requestUrl}
              onChangeText={setRequestUrl}
              placeholder="https://www.youtube.com/watch?v=..."
              placeholderTextColor="#526887"
              autoCapitalize="none"
              keyboardType="url"
              style={styles.input}
            />
            <Pressable disabled={requestLoading || !requestUrl.trim() || !onRequestMusic} style={styles.primaryButton} onPress={submitRequest}>
              <Text style={styles.buttonText}>{requestLoading ? "Sending..." : "Send request"}</Text>
            </Pressable>
            {!!requestMessage && <Text style={styles.pinkText}>{requestMessage}</Text>}
          </View>
        )}

        <View style={styles.listHeader}>
          <Text style={styles.muted}>{maxItemCount} tracks</Text>
          <Text style={styles.muted}>Per page:</Text>
          <View style={styles.limitRow}>
            {[10, 25, 50, 75, 100].map((n) => (
              <Pressable key={n} onPress={() => { setLimit(n); setCurrentPage(1); }} style={[styles.limitButton, limit === n && styles.pageActive]}>
                <Text style={styles.pageText}>{n}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.pagination}>
          <Pressable
            disabled={currentPage === 1}
            onPress={() =>
              setCurrentPage((p) => Math.max(1, p - 1))
            }
            style={({ pressed }) => [
              styles.limitButton,
              styles.arrowButton,
              currentPage === 1 && styles.pageDisabled,
              pressed && currentPage > 1 && styles.pageActive,
            ]}
          >
            <Text style={styles.arrowText}>‹</Text>
          </Pressable>

          {paginationItems.map((page, index) =>
            page === "ellipsis" ? (
              <Text key={`ellipsis-${index}`} style={styles.ellipsis}>
                …
              </Text>
            ) : (
              <Pressable
                key={page}
                onPress={() => setCurrentPage(page)}
                style={[
                  styles.pageButton,
                  currentPage === page && styles.pageActive,
                ]}
              >
                <Text style={styles.pageText}>{page}</Text>
              </Pressable>
            )
          )}

          <Pressable
            disabled={currentPage === maxPageCount || maxPageCount === 0}
            onPress={() =>
              setCurrentPage((p) => Math.min(maxPageCount, p + 1))
            }
            style={({ pressed }) => [
              styles.limitButton,
              styles.arrowButton,
              (currentPage === maxPageCount || maxPageCount === 0) &&
                styles.pageDisabled,
              pressed && currentPage < maxPageCount && styles.pageActive,
            ]}
          >
            <Text style={styles.arrowText}>›</Text>
          </Pressable>
        </View>

        {loading && <ActivityIndicator color="#f472b6" style={{ marginVertical: 18 }} />}
        <FlatList
          data={musics}
          renderItem={renderMusic}
          keyExtractor={(item) => String(item.id)}
          scrollEnabled={false}
          ListEmptyComponent={!loading ? <Text style={styles.hint}>No music found.</Text> : null}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      </ScrollView>

      <Modal visible={showPlaylistOverlay} transparent animationType="fade" onRequestClose={closeOverlay}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalCloseRow}>
              <Pressable onPress={closeOverlay} hitSlop={10}><Text style={styles.closeText}>×</Text></Pressable>
            </View>
            <Text style={styles.modalTitle}>Playlists</Text>
            <View style={styles.divider} />
            <ScrollView style={{ maxHeight: 260 }}>
              {userPlaylists.map((playlist) => {
                const selected = selectedMusicPlaylistIds.includes(playlist.id);
                return (
                  <Pressable key={playlist.id} style={styles.playlistRow} onPress={() => saveOrRemoveMusicToPlaylist(playlist.id)}>
                    <Text style={styles.menuText}>{playlist.name}</Text>
                    <Text style={[styles.pinkText, styles.bold]}>{selected ? "−" : "+"}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <View style={styles.divider} />
            {showNewPlaylistInput ? (
              <View>
                <TextInput
                  value={newPlaylistName}
                  onChangeText={setNewPlaylistName}
                  placeholder="New playlist name"
                  placeholderTextColor="#526887"
                  style={styles.input}
                />
                <View style={styles.rowEnd}>
                  <Pressable style={styles.secondaryButton} onPress={() => { setShowNewPlaylistInput(false); setNewPlaylistName(""); }}>
                    <Text style={styles.menuText}>Cancel</Text>
                  </Pressable>
                  <Pressable style={styles.primaryButton} onPress={submitPlaylist}>
                    <Text style={styles.buttonText}>Create</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable style={styles.createButton} onPress={() => setShowNewPlaylistInput(true)}>
                <Text style={styles.menuText}>＋ Create playlist</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: "#000a21" 
  },
  screen: { 
    flex: 1, 
    backgroundColor: "#000a21" 
  },
  screenContent: {
    paddingHorizontal: 16,
    paddingTop: 34,
    paddingBottom: 40,
  },
  searchPanel: { 
    padding: 16, 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: "#17365d", 
    backgroundColor: "#071329", 
    marginBottom: 18 
  },
  searchHeader: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    minHeight: 24,
  },
  sectionTitle: {
    color: "#f9a8d4",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 1.5,
    textAlign: "center",
  },
  clearButton: {
    position: "absolute",
    right: 0,
    top: 0,
  },
  label: { 
    color: "#93c5fd", 
    fontSize: 12, 
    fontWeight: "700", 
    marginTop: 14, 
    marginBottom: 8 
  },
  input: { 
    borderWidth: 1, 
    borderColor: "#1e4777", 
    borderRadius: 10, 
    backgroundColor: "#030b1c", 
    color: "#fff", 
    paddingHorizontal: 12,
    paddingVertical: 11, 
    fontSize: 14, 
    marginTop: 8 
  },
  hint: { 
    color: "#7890b1", 
    fontSize: 12, 
    marginTop: 8 },
  genreOption: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 9, 
    paddingVertical: 7 
  },
  genreOptionText: { 
    color: "#dbeafe", 
    fontSize: 14, 
    flexShrink: 1 
  },
  checkbox: { 
    width: 18, 
    height: 18, 
    borderRadius: 4, 
    borderWidth: 1, 
    borderColor: "#31527d", 
    alignItems: "center", 
    justifyContent: "center" 
  },
  checkboxChecked: {
    backgroundColor: "#db2777", 
    borderColor: "#f472b6" 
  },
  checkboxTick: { 
    color: "#fff", 
    fontSize: 12, 
    fontWeight: "800" 
  },
  requestPanel: { 
    padding: 16, 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: "#63204c", 
    backgroundColor: "#0a1a34", 
    marginBottom: 18 
  },
  requestTitle: { 
    color: "#fff", 
    fontSize: 17, 
    fontWeight: "800" 
  },
  primaryButton: { 
    backgroundColor: "#b83280", 
    borderRadius: 10, 
    paddingHorizontal: 14, 
    paddingVertical: 11, 
    alignItems: "center", 
    marginTop: 10 
  },
  secondaryButton: { 
    borderWidth: 1, 
    borderColor: "#24456d", 
    borderRadius: 10, 
    paddingHorizontal: 14, 
    paddingVertical: 11, 
    marginTop: 10 
  },
  buttonText: { 
    color: "#fff", 
    fontWeight: "800", 
    fontSize: 13 
  },
  listHeader: { 
    marginBottom: 10 
  },
  muted: { 
    color: "#91a8c8", 
    fontSize: 12 
  },
  limitRow: { 
    flexDirection: "row", 
    gap: 6, 
    marginTop: 8, 
    flexWrap: "wrap" 
  },
  limitButton: { 
    paddingVertical: 6, 
    paddingHorizontal: 9, 
    borderRadius: 7, 
    backgroundColor: "#102342" 
  },
  pagination: {
    flexDirection: "row",
    flexWrap: "nowrap",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginBottom: 14,
  },
  pageButton: {
    width: 32,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 7,
    backgroundColor: "#102342",
  },
  arrowButton: {
    width: 32,
    height: 36,
    padding: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 7,
    backgroundColor: "#102342",
  },
  arrowText: {
    color: "#dbeafe",
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 26,
    textAlign: "center",
    includeFontPadding: false,
  },
  ellipsis: {
    width: 18,
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 14,
  },
  pageActive: {
    backgroundColor: "#831843",
    borderWidth: 1,
    borderColor: "#ec4899",
  },
  pageDisabled: {
    opacity: 0.4,
  },
  genreExpandButton: {
    alignSelf: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 4,
    marginTop: 4,
  },

  genreExpandText: {
    color: "#f472b6",
    fontSize: 13,
    fontWeight: "700",
  },
  pageText: { 
    color: "#dbeafe", 
    fontSize: 12, 
    fontWeight: "700" 
  },
  musicCard: { 
    position: "relative", 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between", 
    borderWidth: 1, 
    borderColor: "#17365d", 
    borderRadius: 13, 
    backgroundColor: "#0f2a4a", 
    padding: 14, 
    minHeight: 78 
  },
  musicCardActive: { 
    backgroundColor: "#9a0f55", 
    borderColor: "#f472b6" 
  },
  musicInfo: { 
    flex: 1, 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 13, 
    paddingRight: 8 
  },
  note: {
    color: "#60a5fa", 
    fontSize: 24 
  },
  musicText: { 
    flex: 1 
  },
  musicTitle: { 
    color: "#eff6ff", 
    fontSize: 15, 
    fontWeight: "800" 
  },
  genre: { 
    color: "#c4b5fd", 
    fontSize: 12, 
    marginTop: 4 
  },
  pinkText: { 
    color: "#f9a8d4" 
  },
  menuTrigger: { 
    paddingHorizontal: 8, 
    paddingVertical: 3, 
    borderRadius: 20 
  },
  menuDots: { 
    color: "#dbeafe", 
    fontSize: 25, 
    fontWeight: "700" 
  },
  dropdown: { 
    position: "absolute", 
    zIndex: 20, 
    elevation: 10, 
    top: 35, 
    right: 0, 
    width: 190, 
    borderRadius: 10, 
    borderWidth: 1, 
    borderColor: "#24456d", 
    backgroundColor: "#0a192f", 
    paddingVertical: 4 
  },
  menuItem: { 
    paddingVertical: 12, 
    paddingHorizontal: 12 
  },
  menuText: { 
    color: "#dbeafe", 
    fontSize: 13 
  },
  favoriteText: { 
    color: "#f472b6", 
    fontSize: 13 
  },
  modalBackdrop: { 
    flex: 1, 
    backgroundColor: "rgba(0,0,0,0.68)", 
    justifyContent: "center", 
    padding: 22 
  },
  modalCard: { 
    width: "100%", 
    maxWidth: 440, 
    alignSelf: "center", 
    backgroundColor: "#0a192f", 
    borderRadius: 14, 
    borderWidth: 1, 
    borderColor: "#24456d", 
    padding: 16 
  },
  modalCloseRow: { 
    alignItems: "flex-end" 
  },
  closeText: { 
    color: "#fff", 
    fontSize: 28, 
    lineHeight: 30, 
    paddingHorizontal: 4 
  },
  modalTitle: { 
    color: "#fff", 
    textAlign: "center", 
    fontWeight: "800", 
    fontSize: 19, 
    marginBottom: 12 
  },
  divider: { 
    height: 1, 
    backgroundColor: "#24456d", 
    marginVertical: 12 
  },
  playlistRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    paddingVertical: 12, 
    paddingHorizontal: 8, 
    borderRadius: 8 
  },
  bold: { 
    fontWeight: "900", 
    fontSize: 18 
  },
  rowEnd: { 
    flexDirection: "row", 
    justifyContent: "flex-end",
    alignItems: "center", 
    gap: 8 
  },
  createButton: { 
    paddingVertical: 12, 
    alignItems: "center" },
  clearText: {
    color: "#f472b6", 
    fontSize: 13, 
    fontWeight: "700",
  },
});
