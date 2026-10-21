
import { StyleSheet } from "react-native";
import { colors, radius, spacing } from "@/theme";

export const layoutStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },

  screenPadded: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
  },

  screenContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
  },

  header: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
  },

  rowSpaced: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  rowGap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },

  column: {
    flexDirection: "column",
  },

  fill: {
    flex: 1,
  },

  panel: {
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "center",
    padding: spacing.xl,
  },

  modalCard: {
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
});
