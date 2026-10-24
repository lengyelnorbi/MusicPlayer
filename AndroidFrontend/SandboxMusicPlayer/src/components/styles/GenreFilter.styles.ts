import { StyleSheet } from "react-native";
import { colors, radius, spacing, typography } from "@/theme";

export const genreFilterStyles = StyleSheet.create({
  label: {
    color: colors.textPrimary,
    fontSize: typography.bodyEmphasis.fontSize,
    fontWeight: "700",
    marginTop: spacing.lg + 2,
    marginBottom: spacing.sm,
  },
  genreOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceInput,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primary,
  },
  checkboxTick: {
    color: colors.text,
    fontSize: typography.small.fontSize,
    fontWeight: "900",
  },
  genreOptionText: {
    color: colors.textPrimary,
    fontSize: typography.body.fontSize,
    flex: 1,
  },
  genreExpandButton: {
    alignSelf: "flex-start",
    paddingVertical: spacing.sm,
    paddingRight: spacing.md,
  },
  genreExpandText: {
    color: colors.primary,
    fontSize: typography.subtitle.fontSize,
    fontWeight: "700",
  },
  hint: {
    color: colors.textSecondary,
    fontSize: typography.body.fontSize,
    marginTop: spacing.xs,
  },
});