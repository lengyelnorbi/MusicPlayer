
import { StyleSheet } from "react-native";
import { colors, radius, spacing, typography } from "@/theme";

export const formStyles = StyleSheet.create({
  field: {
    marginBottom: spacing.md,
  },

  label: {
    color: colors.primary,
    fontSize: typography.small.fontSize,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },

  input: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceInput,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.body.fontSize,
  },

  inputMultiline: {
    minHeight: 88,
    textAlignVertical: "top",
  },

  inputDisabled: {
    opacity: 0.6,
  },

  placeholder: {
    color: colors.textMuted,
  },

  hint: {
    color: colors.textSecondary,
    fontSize: typography.small.fontSize,
    marginTop: spacing.sm,
    lineHeight: 18,
  },

  sectionTitle: {
    color: colors.primary,
    fontSize: typography.caption.fontSize,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
  },

  screenTitle: {
    color: colors.text,
    fontSize: typography.heading.fontSize,
    fontWeight: "800",
  },
});
