
import { StyleSheet } from "react-native";
import { colors, radius, spacing, typography } from "@/theme";

export const audioPlayerStyles = StyleSheet.create({
  panel: {
    backgroundColor: colors.surfaceRaised,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  trackRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  art: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primarySurface,
    alignItems: "center",
    justifyContent: "center",
  },
  artNote: {
    color: colors.primaryLight,
    fontSize: 25,
  },
  trackInfo: {
    flex: 1,
  },
  trackTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.small.fontSize,
    marginTop: 3,
  },
  smallButton: {
    minWidth: 32,
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  controlButton: {
    minWidth: 38,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  controlText: {
    color: "#e8e4f5",
    fontSize: 21,
  },
  active: {
    color: colors.primary,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "#393448",
    marginTop: spacing.md,
    overflow: "hidden",
  },
  progressFill: {
    height: 4,
    backgroundColor: colors.primary,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
  },
  time: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.xs,
  },
  playButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  playText: {
    color: colors.surfaceRaised,
    fontSize: 22,
    fontWeight: "900",
  },
  queueToggle: {
    alignItems: "center",
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  queueToggleText: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: typography.small.fontSize,
  },
  queueList: {
    maxHeight: 180,
    marginTop: spacing.sm,
    flexGrow: 0,
  },
  queueItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.md,
  },
  queueTitle: {
    color: "#e8e4f5",
    flex: 1,
    fontSize: 13,
  },
  queueNumber: {
    color: colors.textSecondary,
    fontSize: typography.small.fontSize,
  },
  error: {
    color: colors.error,
    fontSize: typography.small.fontSize,
    marginTop: spacing.sm,
  },
});
