import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { genreFilterStyles as styles } from "@/components/styles/GenreFilter.styles";

type Props = {
  genres: string[];
  selectedGenres: string[];
  onToggle: (genre: string) => void;
};

export function GenreFilter({ genres, selectedGenres, onToggle }: Props) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? genres : genres.slice(0, 5);

  return (
    <View>
      <Text style={styles.label}>Genre</Text>

      {genres.length ? (
        <>
          {visible.map((genre) => {
            const checked = selectedGenres.includes(genre);

            return (
              <Pressable
                key={genre}
                accessibilityRole="checkbox"
                accessibilityState={{ checked }}
                style={styles.genreOption}
                onPress={() => onToggle(genre)}
              >
                <View
                  style={[
                    styles.checkbox,
                    checked && styles.checkboxChecked,
                  ]}
                >
                  {checked && <Text style={styles.checkboxTick}>✓</Text>}
                </View>

                <Text style={styles.genreOptionText}>{genre}</Text>
              </Pressable>
            );
          })}

          {genres.length > 5 && (
            <Pressable
              accessibilityRole="button"
              onPress={() => setShowAll((value) => !value)}
              style={styles.genreExpandButton}
            >
              <Text style={styles.genreExpandText}>
                {showAll
                  ? "Show less  ↑"
                  : `Show all ${genres.length} genres  ↓`}
              </Text>
            </Pressable>
          )}
        </>
      ) : (
        <Text style={styles.hint}>No genres have been assigned yet.</Text>
      )}
    </View>
  );
}