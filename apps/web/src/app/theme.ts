/**
 * Shared Theme System — Stock Platform
 * Dark and Light themes with style factories for consistent UI.
 */

export const LIGHT_THEME = {
  // Backgrounds
  bg: "#ffffff",
  bgCard: "#ffffff",
  bgHover: "#f8f9fb",
  bgAlt: "#f4f5f7",
  bgAccent: "#f0f7ff",
  bgNav: "#ffffff",
  bgTicker: "#fafbfc",
  bgDeep: "#f0f2f5",

  // Borders
  border: "#e8ecf0",
  borderLight: "#f0f2f5",
  borderAccent: "#d0e3ff",

  // Text
  text: "#1a1a2e",
  textSecondary: "#5a6070",
  textMuted: "#8b92a0",
  textLight: "#b0b7c3",

  // Data colors
  green: "#0d9f4f",
  greenBg: "#ecfdf3",
  red: "#dc2626",
  redBg: "#fef2f2",
  blue: "#2563eb",
  blueBg: "#eff6ff",
  yellow: "#d97706",
  yellowBg: "#fffbeb",
  orange: "#f7931a",

  // Accent
  accent: "#2563eb",
  accentLight: "#dbeafe",

  // Shadows
  shadow: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)",
  shadowMd: "0 4px 6px rgba(0,0,0,0.04), 0 2px 4px rgba(0,0,0,0.06)",
  shadowLg: "0 10px 15px rgba(0,0,0,0.04), 0 4px 6px rgba(0,0,0,0.06)",

  // Typography
  fontBody: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
  fontMono: "'JetBrains Mono', 'SF Mono', 'Menlo', monospace",

  // Sizes
  radius: 10,
  radiusSm: 6,
};

export const DARK_THEME = {
  // Backgrounds
  bg: "#0d1117",
  bgCard: "#161b22",
  bgHover: "#1c2128",
  bgAlt: "#21262d",
  bgAccent: "#1a2332",
  bgNav: "#0d1117",
  bgTicker: "#161b22",
  bgDeep: "#010409",

  // Borders
  border: "#30363d",
  borderLight: "#21262d",
  borderAccent: "#1f3a5f",

  // Text
  text: "#e6edf3",
  textSecondary: "#8b949e",
  textMuted: "#6e7681",
  textLight: "#484f58",

  // Data colors
  green: "#3fb950",
  greenBg: "#0d2818",
  red: "#f85149",
  redBg: "#3d1214",
  blue: "#58a6ff",
  blueBg: "#0c2d6b",
  yellow: "#d29922",
  yellowBg: "#3b2e00",
  orange: "#f7931a",

  // Accent
  accent: "#58a6ff",
  accentLight: "#1f3a5f",

  // Shadows
  shadow: "0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)",
  shadowMd: "0 4px 6px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.2)",
  shadowLg: "0 10px 15px rgba(0,0,0,0.3), 0 4px 6px rgba(0,0,0,0.2)",

  // Typography
  fontBody: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
  fontMono: "'JetBrains Mono', 'SF Mono', 'Menlo', monospace",

  // Sizes
  radius: 10,
  radiusSm: 6,
};

export type Theme = typeof LIGHT_THEME;

export function getTheme(dark: boolean): Theme {
  return dark ? DARK_THEME : LIGHT_THEME;
}

/** Card style factory */
export function cardStyle(t: Theme): React.CSSProperties {
  return {
    background: t.bgCard,
    borderRadius: t.radius,
    padding: 20,
    marginBottom: 12,
    border: "1px solid " + t.border,
    boxShadow: t.shadow,
  };
}

/** Compact card style factory */
export function cardCompactStyle(t: Theme): React.CSSProperties {
  return {
    ...cardStyle(t),
    padding: 14,
  };
}

/** Label style factory */
export function labelStyle(t: Theme): React.CSSProperties {
  return {
    fontSize: 11,
    fontWeight: 600,
    color: t.textMuted,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    fontFamily: t.fontBody,
  };
}

/** Input style factory */
export function inputFieldStyle(t: Theme): React.CSSProperties {
  return {
    background: t.bgAlt,
    border: "1px solid " + t.border,
    borderRadius: t.radiusSm,
    padding: "8px 12px",
    color: t.text,
    fontFamily: t.fontBody,
    fontSize: 13,
    outline: "none",
    transition: "border-color 0.15s",
  };
}

/** Primary button style factory */
export function btnPrimaryStyle(t: Theme): React.CSSProperties {
  return {
    background: t.accent,
    border: "none",
    borderRadius: t.radiusSm,
    padding: "8px 16px",
    color: "#ffffff",
    fontFamily: t.fontBody,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s",
  };
}

/** Secondary button style factory */
export function btnSecondaryStyle(t: Theme): React.CSSProperties {
  return {
    background: t.bgAlt,
    border: "1px solid " + t.border,
    borderRadius: t.radiusSm,
    padding: "8px 16px",
    color: t.text,
    fontFamily: t.fontBody,
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.15s",
  };
}
