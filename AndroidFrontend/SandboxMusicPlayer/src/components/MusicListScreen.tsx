import React, { useState } from "react";
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, Text, View } from "react-native";
import type { Music } from "@/types/music";
import { addMusicToPlaylist, removeMusicFromPlaylist } from "@/services/musicService";
import { createPlaylist } from "@/services/playlistService";
import { GenreFilter } from "@/components/GenreFilter";
import { MusicCard } from "@/components/MusicCard";
import { MusicPagination } from "@/components/MusicPagination";
import { MusicSearch } from "@/components/MusicSearch";
import { PlaylistModal } from "@/components/PlaylistModal";
import { useMusicList } from "@/components/useMusicList";
import { styles } from "@/styles/styles";
import type { MusicMode } from "@/services/appPreferences";
import { getOfflineTrackUri } from "@/services/offlineLibrary";
import { downloadTrackForOfflineUse } from "@/services/downloadService";

type Props = {
  mode?: MusicMode;
  loggedIn?: boolean;
  onPlayMusic?: (music: Music, currentList: Music[]) => void;
};

export default function MusicListScreen({ mode = "online", loggedIn = false, onPlayMusic }: Props) {
  const music = useMusicList(mode);
  const [activeMusicId, setActiveMusicId] = useState<number | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [showPlaylistOverlay, setShowPlaylistOverlay] = useState(false);
  const [selectedMusicID, setSelectedMusicID] = useState<number | null>(null);
  const [selectedPlaylistIds, setSelectedPlaylistIds] = useState<number[]>([]);
  const [showNewPlaylistInput, setShowNewPlaylistInput] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");

  const openSaveOverlay = (item: Music) => {
    setSelectedMusicID(item.id);
    setSelectedPlaylistIds(item.playlistIDs ?? []);
    setOpenMenuId(null);
    setShowPlaylistOverlay(true);
  };

  const closeOverlay = () => {
    setShowPlaylistOverlay(false);
    setSelectedMusicID(null);
    setShowNewPlaylistInput(false);
    setNewPlaylistName("");
  };

  const togglePlaylist = async (playlistID: number) => {
    if (selectedMusicID == null) return;
    const wasSelected = selectedPlaylistIds.includes(playlistID);

    try {
      if (wasSelected) await removeMusicFromPlaylist(playlistID, selectedMusicID);
      else await addMusicToPlaylist(playlistID, selectedMusicID);

      setSelectedPlaylistIds(current => wasSelected
        ? current.filter(id => id !== playlistID)
        : [...new Set([...current, playlistID])]);
      await music.loadMusic();
    } catch (error) {
      Alert.alert(
        "Playlist update failed",
        error instanceof Error ? error.message : "Could not update this playlist.",
      );
    }
  };

  const submitPlaylist = async () => {
    const name = newPlaylistName.trim();
    if (!name) {
      Alert.alert("Playlist name required", "Enter a name first.");
      return;
    }

    try {
      await createPlaylist(name);
      setNewPlaylistName("");
      setShowNewPlaylistInput(false);
      await music.loadMusic();
    } catch (error) {
      Alert.alert(
        "Could not create playlist",
        error instanceof Error ? error.message : "Please try again.",
      );
    }
  };

  const handleDownload = async (item: Music) => {
    setOpenMenuId(null);
    if (mode === "offline") {
      Alert.alert("Already offline", "This track is already in your offline library.");
      return;
    }

    try {
      await downloadTrackForOfflineUse(item);
      await music.loadMusic();
      Alert.alert("Download complete", `“${item.title}” is ready for offline playback.`);
    } catch (error) {
      Alert.alert(
        "Download failed",
        error instanceof Error ? error.message : "Could not download this track.",
      );
    }
  };

  const playTrack = async (selected: Music) => {
    setOpenMenuId(null);
    try {
      if (mode === "offline") {
        const fileUri = selected.fileUri ?? await getOfflineTrackUri(selected.id);
        if (!fileUri) {
          Alert.alert("Track unavailable", "This song is not downloaded for offline playback.");
          return;
        }
        setActiveMusicId(selected.id);
        onPlayMusic?.({ ...selected, fileUri }, music.musics);
      } else {
        setActiveMusicId(selected.id);
        onPlayMusic?.(selected, music.musics);
      }
    } catch (error) {
      Alert.alert("Playback failed", error instanceof Error ? error.message : "Unable to start playback.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.muted}>
          {mode === "online" ? "Online catalogue · downloads saved for offline listening" : "Offline library · downloaded files only"}
        </Text>

        <View style={styles.searchPanel}>
          <MusicSearch
            value={music.searchTerm}
            onChangeText={music.setSearchTerm}
            onClear={music.clearFilters}
            showClear={!!music.searchTerm || music.selectedGenres.length > 0}
          />
          <GenreFilter genres={music.availableGenres} selectedGenres={music.selectedGenres} onToggle={music.toggleGenre} />
        </View>

        <View style={styles.listHeader}>
          <Text style={styles.muted}>{music.maxItemCount} tracks</Text>
          <Text style={styles.muted}>Per page:</Text>
          <View style={styles.limitRow}>
            {[10, 25, 50, 75, 100].map(value => (
              <Text
                key={value}
                accessibilityRole="button"
                onPress={() => music.changeLimit(value)}
                style={[styles.limitButton, music.limit === value && styles.pageActive, styles.pageText]}
              >
                {value}
              </Text>
            ))}
          </View>
        </View>

        <MusicPagination currentPage={music.currentPage} maxPageCount={music.maxPageCount} onPageChange={music.setCurrentPage} />
        {music.loading && <ActivityIndicator accessibilityLabel="Loading music" color="#f472b6" style={{ marginVertical: 18 }} />}
        {!!music.error && <Text accessibilityRole="alert" style={styles.errorMessage}>{music.error}</Text>}

        <View style={{ gap: 10 }}>
          {music.musics.map(item => (
            <MusicCard
              key={item.id}
              item={item}
              active={activeMusicId === item.id}
              loggedIn={loggedIn && mode === "online"}
              menuOpen={openMenuId === item.id}
              onPlay={playTrack}
              onToggleMenu={id => setOpenMenuId(current => current === id ? null : id)}
              onSaveToPlaylist={mode === "online" ? openSaveOverlay : undefined}
              onDownload={handleDownload}
            />
          ))}
          {!music.loading && !music.error && music.musics.length === 0 && (
            <Text style={styles.hint}>No music found.</Text>
          )}
        </View>
      </ScrollView>

      <PlaylistModal
        visible={showPlaylistOverlay}
        playlists={music.userPlaylists}
        selectedPlaylistIds={selectedPlaylistIds}
        showNewInput={showNewPlaylistInput}
        newPlaylistName={newPlaylistName}
        onClose={closeOverlay}
        onTogglePlaylist={togglePlaylist}
        onShowNewInput={() => setShowNewPlaylistInput(true)}
        onNewNameChange={setNewPlaylistName}
        onCancelNew={() => { setShowNewPlaylistInput(false); setNewPlaylistName(""); }}
        onCreate={submitPlaylist}
      />
    </SafeAreaView>
  );
}
