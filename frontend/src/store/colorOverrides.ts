import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface ColorOverrides {
  [colorName: string]: string; // HSL values like "341 61% 33%"
}

interface ColorOverrideStore {
  colors: ColorOverrides;
  updateColor: (colorName: string, value: string) => void;
  resetColor: (colorName: string) => void;
  resetAll: () => void;
  applyColors: () => void;
}

const STORAGE_KEY = "color-overrides";

// Default color values - Monochrome grays with orange accents
const DEFAULT_COLORS: Record<string, string> = {
  background: "0 0% 98%",
  foreground: "0 0% 10%",
  card: "0 0% 100%",
  "card-foreground": "0 0% 10%",
  popover: "0 0% 100%",
  "popover-foreground": "0 0% 10%",
  primary: "25 95% 53%",
  "primary-foreground": "0 0% 100%",
  secondary: "0 0% 90%",
  "secondary-foreground": "0 0% 20%",
  muted: "0 0% 96%",
  "muted-foreground": "0 0% 45%",
  accent: "0 0% 96%",
  "accent-foreground": "0 0% 10%",
  destructive: "0 84% 60%",
  "destructive-foreground": "0 0% 100%",
  border: "0 0% 88%",
  input: "0 0% 88%",
  ring: "25 95% 53%",
};

export const useColorOverrides = create<ColorOverrideStore>()(
  persist(
    (set, get) => ({
      colors: {},
      updateColor: (colorName: string, value: string) => {
        set((state) => ({
          colors: {
            ...state.colors,
            [colorName]: value,
          },
        }));
        // Apply immediately
        get().applyColors();
      },
      resetColor: (colorName: string) => {
        set((state) => {
          const newColors = { ...state.colors };
          delete newColors[colorName];
          return { colors: newColors };
        });
        // Apply immediately
        get().applyColors();
      },
      resetAll: () => {
        set({ colors: {} });
        // Reset all CSS variables to defaults
        Object.keys(DEFAULT_COLORS).forEach((colorName) => {
          document.documentElement.style.setProperty(
            `--${colorName}`,
            DEFAULT_COLORS[colorName]
          );
        });
      },
      applyColors: () => {
        const { colors } = get();
        Object.entries(colors).forEach(([colorName, value]) => {
          document.documentElement.style.setProperty(`--${colorName}`, value);
        });
        // Reset any colors that were removed
        Object.keys(DEFAULT_COLORS).forEach((colorName) => {
          if (!colors[colorName]) {
            document.documentElement.style.setProperty(
              `--${colorName}`,
              DEFAULT_COLORS[colorName]
            );
          }
        });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        // Apply colors after rehydration
        if (state) {
          state.applyColors();
        }
      },
    }
  )
);

