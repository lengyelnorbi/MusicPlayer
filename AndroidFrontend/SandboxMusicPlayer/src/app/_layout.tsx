import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useColorScheme } from "react-native";
import { useEffect } from "react";
import { MusicAppProvider, useMusicApp } from "@/context/MusicAppContext";

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

function RootNavigator() {
  const { initializing } = useMusicApp();

  useEffect(() => {
    if (!initializing) void SplashScreen.hideAsync().catch(() => undefined);
  }, [initializing]);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#0b0b12" } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="login" options={{ presentation: "modal" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const scheme = useColorScheme();
  return (
    <ThemeProvider value={scheme === "dark" ? DarkTheme : DefaultTheme}>
      <MusicAppProvider>
        <RootNavigator />
      </MusicAppProvider>
    </ThemeProvider>
  );
}
