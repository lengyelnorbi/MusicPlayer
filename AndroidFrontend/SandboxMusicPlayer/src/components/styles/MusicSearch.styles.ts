import { StyleSheet } from "react-native";
import { colors, radius, spacing, typography } from "@/theme";

export const musicSearchStyles = StyleSheet.create({
  searchHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: typography.subtitle.fontSize,
    fontWeight: "800",
    letterSpacing: 1,
  },
  clearButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  clearText: {
    color: colors.primary,
    fontSize: typography.small.fontSize,
    fontWeight: "700",
  },
  label: {
    color: colors.textPrimary,
    fontSize: typography.bodyEmphasis.fontSize,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
  input: {
    color: colors.textPrimary,
    backgroundColor: colors.surfaceInput,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.body.fontSize,
  },
  inputPlaceholder: {
    color: colors.textMuted,
  },
  hint: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    marginTop: spacing.sm,
  },
});