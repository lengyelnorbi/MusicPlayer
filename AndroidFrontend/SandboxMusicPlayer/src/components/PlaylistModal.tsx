import React from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import type { Playlist } from "@/types/playlist";
import { styles } from "@/styles/styles";
type Props = {
  visible: boolean; playlists: Playlist[]; selectedPlaylistIds: number[]; showNewInput: boolean; newPlaylistName: string;
  onClose: () => void; onTogglePlaylist: (id: number) => void; onShowNewInput: () => void;
  onNewNameChange: (name: string) => void; onCancelNew: () => void; onCreate: () => void;
};
export function PlaylistModal(p: Props) {
  return <Modal visible={p.visible} transparent animationType="fade" onRequestClose={p.onClose}>
    <View style={styles.modalBackdrop}><View style={styles.modalCard}>
      <View style={styles.modalCloseRow}><Pressable onPress={p.onClose} hitSlop={10}><Text style={styles.closeText}>×</Text></Pressable></View>
      <Text style={styles.modalTitle}>Playlists</Text><View style={styles.divider} />
      <ScrollView style={{ maxHeight: 260 }}>
        {p.playlists.map(pl => {
          const selected = p.selectedPlaylistIds.includes(pl.id);
          return <Pressable key={pl.id} style={styles.playlistRow} onPress={() => p.onTogglePlaylist(pl.id)}>
            <Text style={styles.menuText}>{pl.name}</Text><Text style={[styles.pinkText, styles.bold]}>{selected ? "−" : "+"}</Text>
          </Pressable>;
        })}
      </ScrollView>
      <View style={styles.divider} />
      {p.showNewInput ? <View>
        <TextInput value={p.newPlaylistName} onChangeText={p.onNewNameChange} placeholder="New playlist name" placeholderTextColor="#526887" style={styles.input} />
        <View style={styles.rowEnd}>
          <Pressable style={styles.secondaryButton} onPress={p.onCancelNew}><Text style={styles.menuText}>Cancel</Text></Pressable>
          <Pressable style={styles.primaryButton} onPress={p.onCreate}><Text style={styles.buttonText}>Create</Text></Pressable>
        </View>
      </View> : <Pressable style={styles.createButton} onPress={p.onShowNewInput}><Text style={styles.menuText}>＋ Create playlist</Text></Pressable>}
    </View></View>
  </Modal>;
}
