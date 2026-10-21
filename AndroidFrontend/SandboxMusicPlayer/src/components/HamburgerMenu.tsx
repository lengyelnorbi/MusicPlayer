import { router } from "expo-router";
import { Cloud, LogIn, LogOut, Music, Settings } from "lucide-react-native";
import { Alert, Modal, Pressable, Text, View } from "react-native";

import { useMusicApp } from "@/context/MusicAppContext";
import { colors } from "@/theme";
import { hamburgerMenuStyles as styles } from "@/components/styles/HamburgerMenu.styles";

export function HamburgerMenu({ onLogin }: { onLogin: () => void }) {
  const { menuOpen, setMenuOpen, mode, setMode, session, logout } = useMusicApp();

  const selectMode = async (nextMode: "online" | "offline") => {
    try {
      await setMode(nextMode);
    } catch (error) {
      Alert.alert(
        "Could not change library mode",
        error instanceof Error ? error.message : "Please try again.",
      );
    }
  };

  const signOut = async () => {
    try {
      await logout();
      setMenuOpen(false);
    } catch (error) {
      Alert.alert(
        "Could not sign out",
        error instanceof Error ? error.message : "Please try again.",
      );
    }
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <Modal
      visible={menuOpen}
      transparent
      animationType="fade"
      onRequestClose={closeMenu}
    >
      <View style={styles.overlay}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close navigation menu"
          style={styles.dismissArea}
          onPress={closeMenu}
        />

        <View style={styles.drawer}>
          <Text style={styles.title}>Music library</Text>
          <Text style={styles.subtitle}>
            {session?.user?.username ??
              session?.user?.Username ??
              "Not signed in"}
          </Text>

          <View style={styles.separator} />
          <Text style={styles.sectionTitle}>LIBRARY MODE</Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Switch to online library"
            accessibilityState={{ selected: mode === "online" }}
            style={[styles.item, mode === "online" && styles.selected]}
            onPress={() => void selectMode("online")}
          >
            <View style={styles.itemRow}>
              <Cloud size={24} color={colors.primaryLight} />
              <Text style={styles.itemText}>Online library</Text>
            </View>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Switch to offline library"
            accessibilityState={{ selected: mode === "offline" }}
            style={[styles.item, mode === "offline" && styles.selected]}
            onPress={() => void selectMode("offline")}
          >
            <View style={styles.itemRow}>
              <Music size={24} color={colors.primaryLight} />
              <Text style={styles.itemText}>Offline library</Text>
            </View>
          </Pressable>

          {session && (
            <>
              <View style={styles.separator} />
              <Text style={styles.sectionTitle}>LOCAL DATA</Text>

              <Pressable
                accessibilityRole="button"
                style={styles.item}
                onPress={() => {
                  closeMenu();
                  router.push("/settings");
                }}
              >
                <View style={styles.itemRow}>
                  <Settings size={22} color={colors.primaryLight} />
                  <Text style={styles.itemText}>Settings</Text>
                </View>
              </Pressable>
            </>
          )}

          <View style={styles.separator} />

          {session ? (
            <Pressable
              accessibilityRole="button"
              style={styles.item}
              onPress={() => void signOut()}
            >
              <View style={styles.itemRow}>
                <LogOut size={22} color={colors.primaryLight} />
                <Text style={styles.itemText}>Log out</Text>
              </View>
            </Pressable>
          ) : (
            <Pressable
              accessibilityRole="button"
              style={styles.item}
              onPress={() => {
                closeMenu();
                onLogin();
              }}
            >
              <View style={styles.itemRow}>
                <LogIn size={22} color={colors.primaryLight} />
                <Text style={styles.itemText}>Login</Text>
              </View>
            </Pressable>
          )}

          <Pressable
            accessibilityRole="button"
            style={styles.close}
            onPress={closeMenu}
          >
            <Text style={styles.closeText}>Close menu</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}