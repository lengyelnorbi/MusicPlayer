import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import LoginScreen from "@/components/LoginScreen";
import { useMusicApp } from "@/context/MusicAppContext";
import { loginRouteStyles as styles } from "@/styles/loginRoute.styles";

export default function LoginRoute() {
  const router = useRouter();
  const { refreshSession } = useMusicApp();

  const handleAuthenticated = async () => {
    await refreshSession();
    router.back();
  };

  return (
    <View style={styles.root}>
      <View style={styles.top}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          hitSlop={8}
        >
          <Text style={styles.back}>← Back</Text>
        </Pressable>
      </View>

      <LoginScreen onAuthenticated={handleAuthenticated} />
    </View>
  );
}