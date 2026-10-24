import { StyleSheet } from "react-native";
import { colors, radius, spacing, typography } from "@/theme";

export const musicListScreenStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screenContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  muted: {
    color: colors.textSecondary,
    fontSize: typography.small.fontSize,
  },
  searchPanel: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
  },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  limitRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  limitButton: {
    minWidth: 38,
    minHeight: 36,
    paddingHorizontal: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pageActive: {
    backgroundColor: colors.primarySurface,
    borderColor: colors.primary,
  },
  pageText: {
    color: colors.textPrimary,
    fontSize: typography.small.fontSize,
    fontWeight: "600",
  },
  pageActiveText: {
    color: colors.text,
    fontWeight: "800",
  },
  loadingIndicator: {
    color: colors.primary,
    marginVertical: spacing.lg + 2,
  },
  errorMessage: {
    color: colors.errorText,
    backgroundColor: colors.errorSurface,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: radius.md,
    padding: spacing.md,
    marginVertical: spacing.sm,
    fontSize: typography.body.fontSize,
  },
  musicList: {
    gap: spacing.sm,
  },
  hint: {
    color: colors.textSecondary,
    fontSize: typography.body.fontSize,
    textAlign: "center",
    paddingVertical: spacing.xl,
  },
});