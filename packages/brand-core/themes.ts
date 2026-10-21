import { palette } from "./palette";

export type Pillar = "exercise" | "diet" | "wellness" | "lifestyle";

export const PILLARS: readonly Pillar[] = ["exercise", "diet", "wellness", "lifestyle"];

export type ThemeName = "light" | "dark";

// Keys mirror the CSS variable names the web app already uses (camelCase → --kebab-case),
// so re-pointing these values re-skins every existing `var(--x)` usage.
export type ThemeColors = {
  background: string;
  foreground: string;
  surface: string;
  surfaceStrong: string;
  surfaceElevated: string;
  surfaceContrast: string;
  border: string;
  borderStrong: string;
  muted: string;
  mutedStrong: string;
  brand: string;
  brandStrong: string;
  brandForeground: string;
  accent: string;
  accentStrong: string;
  accentForeground: string;
  frankie: string;
  frankieSoft: string;
  celebrate: string;
  celebrateForeground: string;
  success: string;
  danger: string;
  pillarExercise: string;
  pillarDiet: string;
  pillarWellness: string;
  pillarLifestyle: string;
};

export type ThemeShadows = {
  shadowSoft: string;
  shadowCard: string;
};

export type Theme = {
  name: ThemeName;
  colors: ThemeColors;
  shadows: ThemeShadows;
};

export const lightTheme: Theme = {
  name: "light",
  colors: {
    background: palette.cream,
    foreground: palette.ink,
    surface: "#FFFFFF",
    surfaceStrong: "#F3EEE3",
    surfaceElevated: "#FFFDF8",
    surfaceContrast: "#E9E1D1",
    border: "#E6DECF",
    borderStrong: "#D3C7B1",
    muted: "#6B6458",
    mutedStrong: "#47413A",
    brand: "#3F7D4E",
    brandStrong: "#33683F",
    brandForeground: "#FFFFFF",
    accent: "#2563EB",
    accentStrong: "#2563EB",
    accentForeground: "#FFFFFF",
    frankie: palette.earBrown,
    frankieSoft: "#F5E8D6",
    celebrate: palette.sunshine,
    celebrateForeground: palette.ink,
    success: "#1E8449",
    danger: "#C53030",
    pillarExercise: "#3F7D4E",
    pillarDiet: "#B7791F",
    pillarWellness: "#2B6CB0",
    pillarLifestyle: "#A86A2E"
  },
  shadows: {
    shadowSoft: "0 18px 48px rgba(74, 58, 32, 0.10)",
    shadowCard: "0 8px 24px rgba(74, 58, 32, 0.08)"
  }
};

export const darkTheme: Theme = {
  name: "dark",
  colors: {
    background: palette.midnight,
    foreground: palette.cream,
    surface: "#12264A",
    surfaceStrong: "#0E2044",
    surfaceElevated: "#16305A",
    surfaceContrast: "#1E3A6B",
    border: "#23395F",
    borderStrong: "#33507F",
    muted: palette.slate,
    mutedStrong: "#CBD5E1",
    brand: palette.sage,
    brandStrong: "#16A34A",
    brandForeground: palette.midnight,
    accent: "#60A5FA",
    accentStrong: "#2563EB",
    accentForeground: "#FFFFFF",
    frankie: palette.frankieTan,
    frankieSoft: "#2F3444",
    celebrate: palette.sunshine,
    celebrateForeground: palette.midnight,
    success: palette.successGreen,
    danger: palette.coralTreat,
    pillarExercise: palette.sage,
    pillarDiet: palette.sunshine,
    pillarWellness: "#60A5FA",
    pillarLifestyle: palette.frankieTan
  },
  shadows: {
    shadowSoft: "0 18px 60px rgba(3, 10, 25, 0.40)",
    shadowCard: "0 10px 32px rgba(3, 10, 25, 0.30)"
  }
};

export const themes: Record<ThemeName, Theme> = { light: lightTheme, dark: darkTheme };

export function pillarColor(colors: ThemeColors, pillar: Pillar): string {
  const byPillar: Record<Pillar, string> = {
    exercise: colors.pillarExercise,
    diet: colors.pillarDiet,
    wellness: colors.pillarWellness,
    lifestyle: colors.pillarLifestyle
  };
  return byPillar[pillar];
}
