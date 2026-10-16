import React from "react";
import { Alert, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useMusicApp } from "@/context/MusicAppContext";
import CreateSqliteDatabaseButton from "@/components/CreateSqliteDatabaseButton";

export function HamburgerMenu({ onLogin }: { onLogin: () => void }) {
  const { menuOpen, setMenuOpen, mode, setMode, session, logout } = useMusicApp();

  const selectMode = async (nextMode: "online" | "offline") => {
    try {
      await setMode(nextMode);
    } catch (error) {
      Alert.alert("Could not change library mode", error instanceof Error ? error.message : "Please try again.");
    }
  };

  const signOut = async () => {
    try {
      await logout();
      setMenuOpen(false);
    } catch (error) {
      Alert.alert("Could not sign out", error instanceof Error ? error.message : "Please try again.");
    }
  };

  return (
    <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
      <View style={styles.overlay}>
        <Pressable accessibilityLabel="Close navigation menu" style={styles.scrim} onPress={() => setMenuOpen(false)} />
        <View style={styles.drawer}>
          <Text style={styles.heading}>Music library</Text>
          <Text style={styles.subheading}>{session?.user?.username ?? session?.user?.Username ?? "Not signed in"}</Text>
          <View style={styles.separator} />
          <Text style={styles.section}>LIBRARY MODE</Text>
          <Pressable style={[styles.item, mode === "online" && styles.selected]} onPress={() => void selectMode("online")}>
            <Text style={styles.itemText}>☁  Online library</Text>
          </Pressable>
          <Pressable style={[styles.item, mode === "offline" && styles.selected]} onPress={() => void selectMode("offline")}>
            <Text style={styles.itemText}>♫  Offline library</Text>
          </Pressable>
          {session && (
            <>
              <View style={styles.separator} />
              <Text style={styles.section}>LOCAL DATA</Text>
              <CreateSqliteDatabaseButton />
            </>
          )}
          <View style={styles.separator} />
          {session ? (
            <Pressable style={styles.item} onPress={() => void signOut()}>
              <Text style={styles.itemText}>↪  Log out</Text>
            </Pressable>
          ) : (
            <Pressable style={styles.item} onPress={() => { setMenuOpen(false); onLogin(); }}>
              <Text style={styles.itemText}>⇥  Login</Text>
            </Pressable>
          )}
          <Pressable style={styles.close} onPress={() => setMenuOpen(false)}>
            <Text style={styles.closeText}>Close menu</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, flexDirection: "row", backgroundColor: "rgba(0,0,0,0.45)" },
  scrim: { flex: 1 },
  drawer: { width: 310, maxWidth: "88%", backgroundColor: "#10101b", paddingTop: 58, paddingHorizontal: 18, borderLeftWidth: 1, borderColor: "#302943" },
  heading: { color: "#fff", fontSize: 24, fontWeight: "900" },
  subheading: { color: "#aaa7bd", marginTop: 6, marginBottom: 18 },
  separator: { height: 1, backgroundColor: "#302943", marginVertical: 14 },
  section: { color: "#a78bfa", fontSize: 11, fontWeight: "900", letterSpacing: 1.5, marginBottom: 8 },
  item: { paddingVertical: 13, paddingHorizontal: 12, borderRadius: 12 },
  selected: { backgroundColor: "#302044" },
  itemText: { color: "#f4f0ff", fontSize: 15, fontWeight: "600" },
  close: { marginTop: "auto", marginBottom: 32, alignItems: "center", padding: 14, borderRadius: 12, backgroundColor: "#272039" },
  closeText: { color: "#ddd6fe", fontWeight: "800" },
});
