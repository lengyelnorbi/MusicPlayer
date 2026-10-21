import { StyleSheet } from "react-native";
import { colors, radius, spacing, typography } from "@/theme";

export const actionButtonStyles = StyleSheet.create({
  container: {
    width: "100%",
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  button: {
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primaryDark,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: colors.text,
    fontSize: typography.bodyEmphasis.fontSize,
    fontWeight: "700",
    textAlign: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonSecondary: {
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonSecondaryText: {
    color: colors.textPrimary,
  },
  pressed: {
    opacity: 0.82,
  },
  message: {
    color: colors.primaryLight,
    fontSize: typography.subtitle.fontSize,
    lineHeight: 19,
  },
  successMessage: {
    color: colors.success,
  },
  errorMessage: {
    color: colors.error,
  },
  progressTrack: {
    height: 6,
    borderRadius: radius.pill,
    overflow: "hidden",
    backgroundColor: colors.borderSubtle,
  },
  progressFill: {
    height: "100%",
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
});