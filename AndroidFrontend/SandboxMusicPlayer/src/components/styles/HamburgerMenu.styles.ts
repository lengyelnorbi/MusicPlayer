import { StyleSheet } from "react-native";
import { colors, radius, spacing, typography } from "@/theme";

export const hamburgerMenuStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: colors.overlay,
  },
  dismissArea: {
    flex: 1,
  },
  drawer: {
    width: 310,
    maxWidth: "88%",
    backgroundColor: colors.surface,
    paddingTop: 58,
    paddingHorizontal: spacing.lg + 2,
    borderLeftWidth: 1,
    borderColor: colors.border,
  },
  header: {
    color: colors.text,
    fontSize: typography.heading.fontSize + 2,
    fontWeight: "900",
  },
  title: {
    color: colors.text,
    fontSize: typography.heading.fontSize + 2,
    fontWeight: "900",
  },
  subtitle: {
    color: colors.textSecondary,
    marginTop: spacing.xs + 2,
    marginBottom: spacing.lg + 2,
    fontSize: typography.body.fontSize,
  },
  section: {
    color: colors.primary,
    fontSize: typography.caption.fontSize,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    color: colors.primary,
    fontSize: typography.caption.fontSize,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md + 2,
  },
  item: {
    paddingVertical: spacing.md + 1,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
  },
  selected: {
    backgroundColor: colors.primarySurface,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  itemText: {
    color: colors.textPrimary,
    fontSize: typography.bodyEmphasis.fontSize + 1,
    fontWeight: "600",
  },
  itemTextActive: {
    color: colors.primaryLight,
  },
  footer: {
    marginTop: "auto",
    marginBottom: spacing.xxxl,
    alignItems: "center",
    padding: spacing.md + 2,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceRaised,
  },
  close: {
    marginTop: "auto",
    marginBottom: spacing.xxxl,
    alignItems: "center",
    padding: spacing.md + 2,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceRaised,
  },
  closeText: {
    color: colors.primaryLight,
    fontWeight: "800",
  },
});