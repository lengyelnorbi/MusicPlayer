import { StyleSheet } from "react-native";
import { colors } from "@/theme";

export const rootLayoutStyles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
});