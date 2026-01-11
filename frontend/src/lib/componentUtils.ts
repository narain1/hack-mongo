import { cn } from "@/lib/utils";
import { useComponentOverrides } from "@/store/componentOverrides";

/**
 * Hook to get component override classes
 */
export function useComponentOverride(componentName: string) {
  const overrides = useComponentOverrides((state) => state.overrides);
  return overrides[componentName];
}

/**
 * Merge component classes with overrides
 */
export function applyComponentOverride(
  _componentName: string,
  defaultClassName: string,
  override?: { baseClassName?: string }
): string {
  if (!override?.baseClassName) {
    return defaultClassName;
  }
  // Merge the override with the default, override takes precedence
  return cn(defaultClassName, override.baseClassName);
}

