import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider,
} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  View,
  useColorScheme,
} from "react-native";

import {
  MusicAppProvider,
  useMusicApp,
} from "@/context/MusicAppContext";
import { loadApiBaseUrl } from "@/services/apiConfig";
import { colors } from "@/theme";
import { rootLayoutStyles as styles } from "@/styles/rootLayout.styles";

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

function RootNavigator() {
  const { initializing } = useMusicApp();

  useEffect(() => {
    if (!initializing) {
      void SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [initializing]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: styles.screen,
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="login"
        options={{ presentation: "modal" }}
      />
      <Stack.Screen
        name="settings"
        options={{ presentation: "modal" }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const scheme = useColorScheme();
  const [apiConfigLoaded, setApiConfigLoaded] = useState(false);
  const [apiConfigError, setApiConfigError] = useState(false);

  useEffect(() => {
    let mounted = true;

    loadApiBaseUrl()
      .then(() => {
        if (mounted) {
          setApiConfigLoaded(true);
        }
      })
      .catch((error: unknown) => {
        console.error("Failed to load API configuration:", error);

        if (mounted) {
          setApiConfigError(true);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const theme = scheme === "dark" ? DarkTheme : DefaultTheme;

  if (!apiConfigLoaded) {
    return (
      <ThemeProvider value={theme}>
        <View style={styles.loadingScreen}>
          {!apiConfigError && (
            <ActivityIndicator
              color={colors.primary}
              size="large"
            />
          )}
        </View>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider value={theme}>
      <MusicAppProvider>
        <RootNavigator />
      </MusicAppProvider>
    </ThemeProvider>
  );
}