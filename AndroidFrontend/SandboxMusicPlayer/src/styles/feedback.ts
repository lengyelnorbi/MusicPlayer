
import { StyleSheet } from "react-native";
import { colors, radius, spacing, typography } from "@/theme";

export const feedbackStyles = StyleSheet.create({
  error: {
    color: colors.errorText,
    backgroundColor: colors.errorSurface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginVertical: spacing.md,
    fontSize: typography.body.fontSize,
    lineHeight: 20,
  },

  errorText: {
    color: colors.error,
    fontSize: typography.small.fontSize,
  },

  success: {
    color: colors.successText,
    backgroundColor: colors.successSurface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginVertical: spacing.md,
  },

  muted: {
    color: colors.textSecondary,
    fontSize: typography.small.fontSize,
  },

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxxl,
  },

  emptyTitle: {
    color: colors.text,
    fontSize: typography.title.fontSize,
    fontWeight: "900",
    textAlign: "center",
  },

  emptyDescription: {
    color: colors.textSecondary,
    fontSize: typography.body.fontSize,
    lineHeight: 20,
    textAlign: "center",
    marginTop: spacing.sm,
  },
});
