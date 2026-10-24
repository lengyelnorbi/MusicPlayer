
import { StyleSheet } from "react-native";
import { colors, radius, spacing, typography } from "@/theme";

export const playlistScreenStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  heading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  headingContent: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: typography.screenTitle.fontSize,
    fontWeight: "900",
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.subtitle.fontSize,
    marginTop: spacing.xs,
  },
  primaryButton: {
    backgroundColor: colors.primaryDark,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.text,
    fontWeight: "800",
  },
  createPanel: {
    backgroundColor: colors.surfaceRaised,
    padding: 14,
    borderRadius: radius.xl,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  input: {
    color: colors.text,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 13,
    borderRadius: radius.md,
  },
  list: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: colors.surfaceRaised,
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  art: {
    width: 58,
    height: 58,
    backgroundColor: colors.primarySurface,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  artText: {
    color: colors.primaryLight,
    fontSize: 30,
  },
  playlistName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  playIcon: {
    color: colors.primaryLight,
    fontSize: 18,
  },
  empty: {
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    marginTop: 45,
  },
  musicNote: {
    color: colors.primary,
    fontSize: 58,
    marginBottom: 14,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
  },
  emptyDescription: {
    color: colors.textSecondary,
    fontSize: typography.body.fontSize,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  error: {
    color: colors.error,
    backgroundColor: colors.errorSurface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  loading: {
    marginTop: 30,
  },
});
