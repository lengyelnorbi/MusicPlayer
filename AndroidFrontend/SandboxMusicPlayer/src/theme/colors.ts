
export const colors = {
  background: "#0b0b12",
  surface: "#14131d",
  surfaceRaised: "#171622",
  surfaceElevated: "#1a1725",
  surfaceInput: "#0f0d17",

  border: "#302943",
  borderSubtle: "#252033",

//   primary: "#c4b5fd",
//   primaryLight: "#ddd6fe",
//   primaryDark: "#6d28d9",
//   primarySurface: "#392957",
  primary: "#ff2bd6",
  primaryLight: "#ffb3f0",
  primaryDark: "#c0009f",
  primarySurface: "#4a1242",

  text: "#ffffff",
  textPrimary: "#f5f3ff",
  textSecondary: "#9996ab",
  textMuted: "#858397",

  success: "#34d399",
  successText: "#d1fae5",
  successSurface: "#14291f",

  error: "#fca5a5",
  errorText: "#fecaca",
  errorSurface: "#35191e",

  warning: "#fbbf24",
  warningSurface: "#422006",

  overlay: "rgba(0, 0, 0, 0.68)",
  transparent: "transparent",
} as const;

export type AppColor = keyof typeof colors;
