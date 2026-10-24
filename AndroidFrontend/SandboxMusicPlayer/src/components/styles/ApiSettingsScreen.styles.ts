
import { StyleSheet } from "react-native";
import { colors, spacing, typography } from "@/theme";

export const apiSettingsStyles = StyleSheet.create({
  root: {
    flex: 1,
    marginTop: spacing.lg,
    backgroundColor: colors.background,
  },
  top: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  back: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "700",
  },
  content: {
    flex: 1,
    padding: spacing.xl,
    gap: spacing.md,
  },
  title: {
    color: colors.primary,
    fontSize: typography.heading.fontSize,
    fontWeight: "800",
  },
  label: {
    color: colors.primary,
    fontSize: typography.body.fontSize,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    color: colors.text,
    backgroundColor: colors.surfaceInput,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  section: {
    color: colors.primary,
    fontSize: typography.caption.fontSize,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
  },
});
