import { Alert, View } from "react-native";

import MusicListScreen from "@/components/MusicListScreen";
import { useMusicApp } from "@/context/MusicAppContext";
import { usePlayback } from "@/context/PlaybackContext";
import { musicRouteStyles as styles } from "@/styles/musicRoute.styles";

export default function MusicsRoute() {
  const { mode, session } = useMusicApp();
  const { playCatalogueTrack } = usePlayback();

  return (
    <View style={styles.container}>
      <MusicListScreen
        mode={mode}
        loggedIn={!!session}
        onPlayMusic={(track) => {
          void playCatalogueTrack(track, mode).catch((error: unknown) => {
            Alert.alert(
              "Playback failed",
              error instanceof Error
                ? error.message
                : "Could not play track.",
            );
          });
        }}
      />
    </View>
  );
}