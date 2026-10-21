import { StyleSheet } from "react-native";
import { colors, radius, spacing, typography } from "@/theme";

export const musicCardStyles = StyleSheet.create({
  musicCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  musicCardActive: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.primary,
  },
  musicInfo: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  note: {
    color: colors.textSecondary,
    fontSize: 25,
    fontWeight: "700",
  },
  pinkText: {
    color: colors.primaryLight,
  },
  musicText: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xxs,
  },
  musicTitle: {
    color: colors.textPrimary,
    fontSize: typography.bodyEmphasis.fontSize,
    fontWeight: "700",
  },
  muted: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize,
  },
  genre: {
    color: colors.primary,
    fontSize: typography.small.fontSize,
    fontWeight: "500",
  },
  menuTrigger: {
    width: 36,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
  },
  menuDots: {
    color: colors.textPrimary,
    fontSize: 25,
    fontWeight: "700",
  },
  dropdown: {
    position: "absolute",
    top: 42,
    right: 0,
    minWidth: 180,
    zIndex: 10,
    elevation: 6,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.xs,
  },
  menuItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.sm,
  },
  menuText: {
    color: colors.textPrimary,
    fontSize: typography.body.fontSize,
    fontWeight: "500",
  },
});