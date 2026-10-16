import React from "react";
import { Pressable, Text, View } from "react-native";
import type { Music } from "@/types/music";
import { styles } from "@/styles/styles";

type Props = {
  item: Music;
  active: boolean;
  loggedIn: boolean;
  menuOpen: boolean;
  onPlay: (item: Music) => void;
  onToggleMenu: (id: number) => void;
  onSaveToPlaylist?: (item: Music) => void;
  onDownload: (item: Music) => void;
};

export function MusicCard({
  item,
  active,
  loggedIn,
  menuOpen,
  onPlay,
  onToggleMenu,
  onSaveToPlaylist,
  onDownload,
}: Props) {
  return (
    <View style={[styles.musicCard, active && styles.musicCardActive]}>
      <Pressable accessibilityRole="button" style={styles.musicInfo} onPress={() => onPlay(item)}>
        <Text style={[styles.note, active && styles.pinkText]}>♫</Text>
        <View style={styles.musicText}>
          <Text numberOfLines={2} style={styles.musicTitle}>{item.title}</Text>
          {!!item.addedAt && <Text style={styles.muted}>{item.addedAt}</Text>}
          {!!item.genre && <Text style={styles.genre}>{item.genre}</Text>}
        </View>
      </Pressable>
      {loggedIn && (
        <View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Actions for ${item.title}`}
            style={styles.menuTrigger}
            onPress={() => onToggleMenu(item.id)}
          >
            <Text style={styles.menuDots}>⋮</Text>
          </Pressable>
          {menuOpen && (
            <View style={styles.dropdown}>
              {onSaveToPlaylist && (
                <Pressable style={styles.menuItem} onPress={() => onSaveToPlaylist(item)}>
                  <Text style={styles.menuText}>＋ Save to playlist</Text>
                </Pressable>
              )}
              <Pressable style={styles.menuItem} onPress={() => onDownload(item)}>
                <Text style={styles.menuText}>⇩ Download for offline</Text>
              </Pressable>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
