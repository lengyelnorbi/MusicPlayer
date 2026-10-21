import { StyleSheet } from "react-native";
import { colors, radius, spacing, typography } from "@/theme";

export const musicPaginationStyles = StyleSheet.create({
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
  limitButton: {
    minWidth: 36,
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  arrowButton: {
    width: 38,
  },
  arrowText: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: "600",
    lineHeight: 28,
  },
  pageButton: {
    minWidth: 36,
    height: 36,
    paddingHorizontal: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
  },
  pageActive: {
    backgroundColor: colors.primarySurface,
    borderColor: colors.primary,
  },
  pageText: {
    color: colors.textPrimary,
    fontSize: typography.body.fontSize,
    fontWeight: "600",
  },
  pageTextActive: {
    color: colors.text,
    fontWeight: "800",
  },
  pageDisabled: {
    opacity: 0.35,
  },
  ellipsis: {
    minWidth: 20,
    textAlign: "center",
    color: colors.textMuted,
    fontSize: typography.body.fontSize,
  },
});