import { StyleSheet } from "react-native";
import { colors, spacing, typography } from "@/theme";

export const loginRouteStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  top: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg + 2,
  },
  back: {
    color: colors.primary,
    fontSize: typography.bodyEmphasis.fontSize + 2,
    fontWeight: "700",
  },
});