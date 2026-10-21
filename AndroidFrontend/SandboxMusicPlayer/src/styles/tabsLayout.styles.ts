import { StyleSheet } from "react-native";
import { colors, radius, spacing, typography } from "@/theme";

export const tabsLayoutStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeTop: {
    backgroundColor: colors.background,
  },
  header: {
    minHeight: 68,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuIcon: {
    color: colors.primaryLight,
    fontSize: 21,
    fontWeight: "800",
  },
  brandBlock: {
    flex: 1,
    minWidth: 0,
  },
  brand: {
    color: colors.text,
    fontSize: typography.title.fontSize,
    fontWeight: "900",
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize,
    marginTop: spacing.xxs,
  },
  modeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
    backgroundColor: colors.successSurface,
    paddingHorizontal: spacing.md - 3,
    paddingVertical: spacing.sm - 1,
    borderRadius: radius.pill,
  },
  offlineBadge: {
    backgroundColor: colors.primarySurface,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.success,
  },
  offlineDot: {
    backgroundColor: colors.primary,
  },
  modeText: {
    color: colors.successText,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  offlineModeText: {
    color: colors.primaryLight,
  },
  accountButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceRaised,
    alignItems: "center",
    justifyContent: "center",
  },
  accountIcon: {
    color: colors.primaryLight,
    fontSize: 21,
  },
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.borderSubtle,
  },
  tabBarLabel: {
    fontWeight: "700",
  },
});