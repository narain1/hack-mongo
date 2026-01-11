import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface ComponentOverride {
  baseClassName?: string;
  variantOverrides?: Record<string, Record<string, string>>;
}

export interface ComponentOverrides {
  [componentName: string]: ComponentOverride;
}

interface ComponentOverrideStore {
  overrides: ComponentOverrides;
  updateOverride: (componentName: string, override: ComponentOverride) => void;
  resetOverride: (componentName: string) => void;
  resetAll: () => void;
}

const STORAGE_KEY = "component-overrides";

export const useComponentOverrides = create<ComponentOverrideStore>()(
  persist(
    (set) => ({
      overrides: {},
      updateOverride: (componentName: string, override: ComponentOverride) =>
        set((state) => ({
          overrides: {
            ...state.overrides,
            [componentName]: override,
          },
        })),
      resetOverride: (componentName: string) =>
        set((state) => {
          const newOverrides = { ...state.overrides };
          delete newOverrides[componentName];
          return { overrides: newOverrides };
        }),
      resetAll: () => set({ overrides: {} }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
    }
  )
);

