
import { StyleSheet } from "react-native";
import { colors, radius, spacing, typography } from "@/theme";

export const buttonStyles = StyleSheet.create({
  primary: {
    minHeight: 44,
    backgroundColor: colors.primaryDark,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },

  secondary: {
    minHeight: 44,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },

  subtle: {
    minHeight: 36,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },

  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  text: {
    color: colors.text,
    fontSize: typography.body.fontSize,
    fontWeight: "800",
    textAlign: "center",
  },

  secondaryText: {
    color: colors.primaryLight,
    fontSize: typography.body.fontSize,
    fontWeight: "700",
    textAlign: "center",
  },

  disabled: {
    opacity: 0.55,
  },
});
