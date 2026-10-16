import React from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { styles } from "@/styles/styles";

type Props = { value: string; onChangeText: (v: string) => void; onClear: () => void; showClear: boolean };
export function MusicSearch({ value, onChangeText, onClear, showClear }: Props) {
  return <View>
    <View style={styles.searchHeader}>
      <Text style={styles.sectionTitle}>COMPLEX SEARCH</Text>
      {showClear && <Pressable style={styles.clearButton} onPress={onClear}><Text style={styles.clearText}>Clear</Text></Pressable>}
    </View>
    <Text style={styles.label}>Title</Text>
    <TextInput value={value} onChangeText={onChangeText} placeholder="Search music titles..." placeholderTextColor="#526887" style={styles.input} returnKeyType="search" />
    <Text style={styles.hint}>Search starts 2 seconds after typing stops.</Text>
  </View>;
}
