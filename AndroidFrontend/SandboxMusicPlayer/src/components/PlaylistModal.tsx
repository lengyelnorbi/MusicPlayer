import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import type { Playlist } from "@/types/playlist";
import { playlistModalStyles as styles } from "@/components/styles/PlaylistModal.styles";

type Props = {
  visible: boolean;
  playlists: Playlist[];
  selectedPlaylistIds: number[];
  showNewInput: boolean;
  newPlaylistName: string;
  onClose: () => void;
  onTogglePlaylist: (id: number) => void;
  onShowNewInput: () => void;
  onNewNameChange: (name: string) => void;
  onCancelNew: () => void;
  onCreate: () => void;
};

export function PlaylistModal(p: Props) {
  return (
    <Modal
      visible={p.visible}
      transparent
      animationType="fade"
      onRequestClose={p.onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalCloseRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close playlists"
              onPress={p.onClose}
              hitSlop={10}
              style={styles.closeButton}
            >
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>

          <Text style={styles.modalTitle}>Playlists</Text>
          <View style={styles.divider} />

          <ScrollView
            style={styles.playlistScroll}
            keyboardShouldPersistTaps="handled"
          >
            {p.playlists.map((playlist) => {
              const selected = p.selectedPlaylistIds.includes(playlist.id);

              return (
                <Pressable
                  key={playlist.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${playlist.name}, ${
                    selected ? "selected" : "not selected"
                  }`}
                  accessibilityState={{ selected }}
                  style={styles.playlistRow}
                  onPress={() => p.onTogglePlaylist(playlist.id)}
                >
                  <Text style={styles.menuText}>{playlist.name}</Text>
                  <Text style={[styles.pinkText, styles.bold]}>
                    {selected ? "−" : "+"}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.divider} />

          {p.showNewInput ? (
            <View>
              <TextInput
                value={p.newPlaylistName}
                onChangeText={p.onNewNameChange}
                placeholder="New playlist name"
                placeholderTextColor={styles.inputPlaceholder.color as string}
                style={styles.input}
                accessibilityLabel="New playlist name"
                returnKeyType="done"
              />

              <View style={styles.rowEnd}>
                <Pressable
                  accessibilityRole="button"
                  style={styles.secondaryButton}
                  onPress={p.onCancelNew}
                >
                  <Text style={styles.menuText}>Cancel</Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  style={styles.primaryButton}
                  onPress={p.onCreate}
                >
                  <Text style={styles.buttonText}>Create</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              style={styles.createButton}
              onPress={p.onShowNewInput}
            >
              <Text style={styles.menuText}>＋ Create playlist</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}