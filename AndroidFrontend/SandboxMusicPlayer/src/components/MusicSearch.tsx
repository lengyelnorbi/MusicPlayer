import { Pressable, Text, TextInput, View } from "react-native";
import { musicSearchStyles as styles } from "@/components/styles/MusicSearch.styles";

type Props = {
  value: string;
  onChangeText: (v: string) => void;
  onClear: () => void;
  showClear: boolean;
};

export function MusicSearch({
  value,
  onChangeText,
  onClear,
  showClear,
}: Props) {
  return (
    <View>
      <View style={styles.searchHeader}>
        <Text style={styles.sectionTitle}>COMPLEX SEARCH</Text>

        {showClear && (
          <Pressable
            accessibilityRole="button"
            onPress={onClear}
            style={styles.clearButton}
          >
            <Text style={styles.clearText}>Clear</Text>
          </Pressable>
        )}
      </View>

      <Text style={styles.label}>Title</Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Search music titles..."
        placeholderTextColor={styles.inputPlaceholder.color as string}
        style={styles.input}
        returnKeyType="search"
        accessibilityLabel="Search music titles"
      />

      <Text style={styles.hint}>
        Search starts 2 seconds after typing stops.
      </Text>
    </View>
  );
}