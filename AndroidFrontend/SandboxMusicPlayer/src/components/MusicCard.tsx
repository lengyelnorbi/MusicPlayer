import { Pressable, Text, View } from "react-native";

import { musicCardStyles as styles } from "@/components/styles/MusicCard.styles";
import type { Music } from "@/types/music";

type Props = {
  item: Music;
  active: boolean;
  loggedIn: boolean;
  menuOpen: boolean;
  onPlay: (item: Music) => void;
  onToggleMenu: (id: number) => void;
  onSaveToPlaylist?: (item: Music) => void;
};

export function MusicCard({
  item,
  active,
  loggedIn,
  menuOpen,
  onPlay,
  onToggleMenu,
  onSaveToPlaylist,
}: Props) {
  return (
    <View style={[styles.musicCard, active && styles.musicCardActive]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Play ${item.title}`}
        style={styles.musicInfo}
        onPress={() => onPlay(item)}
      >
        <Text style={[styles.note, active && styles.pinkText]}>♫</Text>

        <View style={styles.musicText}>
          <Text numberOfLines={2} style={styles.musicTitle}>
            {item.title}
          </Text>

          {!!item.addedAt && (
            <Text style={styles.muted}>{item.addedAt}</Text>
          )}

          {!!item.genre && (
            <Text style={styles.genre}>{item.genre}</Text>
          )}
        </View>
      </Pressable>

      {loggedIn && (
        <View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Actions for ${item.title}`}
            accessibilityState={{ expanded: menuOpen }}
            style={styles.menuTrigger}
            onPress={() => onToggleMenu(item.id)}
          >
            <Text style={styles.menuDots}>⋮</Text>
          </Pressable>

          {menuOpen && (
            <View style={styles.dropdown}>
              {onSaveToPlaylist && (
                <Pressable
                  accessibilityRole="button"
                  style={styles.menuItem}
                  onPress={() => onSaveToPlaylist(item)}
                >
                  <Text style={styles.menuText}>＋ Save to playlist</Text>
                </Pressable>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
}