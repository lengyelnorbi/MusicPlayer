import { Tabs, useRouter } from "expo-router";
import { ListMusic, Music } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AudioPlayer from "@/components/AudioPlayer";
import { HamburgerMenu } from "@/components/HamburgerMenu";
import { PlaybackProvider } from "@/context/PlaybackContext";
import { useMusicApp } from "@/context/MusicAppContext";
import { colors } from "@/theme";
import { tabsLayoutStyles as styles } from "@/styles/tabsLayout.styles";

export default function TabsLayout() {
  const router = useRouter();
  const { mode, setMenuOpen } = useMusicApp();

  const isOffline = mode === "offline";

  return (
    <PlaybackProvider>
      <View style={styles.root}>
        <SafeAreaView style={styles.safeTop}>
          <View style={styles.header}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open menu"
              onPress={() => setMenuOpen(true)}
              style={styles.menuButton}
            >
              <Text style={styles.menuIcon}>☰</Text>
            </Pressable>

            <View style={styles.brandBlock}>
              <Text style={styles.brand}>My Music</Text>
              <Text style={styles.subtitle}>
                Your library, your way
              </Text>
            </View>

            <View
              style={[
                styles.modeBadge,
                isOffline && styles.offlineBadge,
              ]}
            >
              <View
                style={[
                  styles.dot,
                  isOffline && styles.offlineDot,
                ]}
              />
              <Text
                style={[
                  styles.modeText,
                  isOffline && styles.offlineModeText,
                ]}
              >
                {mode.toUpperCase()}
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open sign in"
              onPress={() => router.push("/login")}
              style={styles.accountButton}
            >
              <Text style={styles.accountIcon}>♙</Text>
            </Pressable>
          </View>
        </SafeAreaView>

        <Tabs
          screenOptions={{
            headerShown: false,
            sceneStyle: {
              backgroundColor: colors.background,
            },
            tabBarStyle: styles.tabBar,
            tabBarActiveTintColor: colors.primaryLight,
            tabBarInactiveTintColor: colors.textMuted,
            tabBarLabelStyle: styles.tabBarLabel,
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: "Musics",
              tabBarIcon: ({ color, size }) => (
                <Music color={color} size={size} />
              ),
            }}
          />

          <Tabs.Screen
            name="playlists"
            options={{
              title: "Playlists",
              tabBarIcon: ({ color, size }) => (
                <ListMusic color={color} size={size} />
              ),
            }}
          />
        </Tabs>

        <HamburgerMenu onLogin={() => router.push("/login")} />
        <AudioPlayer />
      </View>
    </PlaybackProvider>
  );
}