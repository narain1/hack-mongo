import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RotateCcw, Save, Palette } from "lucide-react";
import { useComponentOverrides } from "@/store/componentOverrides";
import { useColorOverrides } from "@/store/colorOverrides";

const COMPONENTS = [
  { name: "Button", displayName: "Button" },
  { name: "Card", displayName: "Card" },
  { name: "Input", displayName: "Input" },
  { name: "Badge", displayName: "Badge" },
  { name: "Avatar", displayName: "Avatar" },
] as const;

const COLOR_GROUPS = [
  {
    group: "Primary",
    colors: [
      { name: "primary", label: "Primary" },
      { name: "primary-foreground", label: "Primary Foreground" },
    ],
  },
  {
    group: "Background",
    colors: [
      { name: "background", label: "Background" },
      { name: "foreground", label: "Foreground" },
    ],
  },
  {
    group: "Card",
    colors: [
      { name: "card", label: "Card" },
      { name: "card-foreground", label: "Card Foreground" },
    ],
  },
  {
    group: "Secondary",
    colors: [
      { name: "secondary", label: "Secondary" },
      { name: "secondary-foreground", label: "Secondary Foreground" },
    ],
  },
  {
    group: "Muted",
    colors: [
      { name: "muted", label: "Muted" },
      { name: "muted-foreground", label: "Muted Foreground" },
    ],
  },
  {
    group: "Accent",
    colors: [
      { name: "accent", label: "Accent" },
      { name: "accent-foreground", label: "Accent Foreground" },
    ],
  },
  {
    group: "Destructive",
    colors: [
      { name: "destructive", label: "Destructive" },
      { name: "destructive-foreground", label: "Destructive Foreground" },
    ],
  },
  {
    group: "Border & Input",
    colors: [
      { name: "border", label: "Border" },
      { name: "input", label: "Input" },
      { name: "ring", label: "Ring" },
    ],
  },
  {
    group: "Popover",
    colors: [
      { name: "popover", label: "Popover" },
      { name: "popover-foreground", label: "Popover Foreground" },
    ],
  },
];

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

function ColorEditor() {
  const { colors, updateColor, resetColor, resetAll } = useColorOverrides();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(["Primary"])
  );

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) {
        next.delete(group);
      } else {
        next.add(group);
      }
      return next;
    });
  };

  const getColorValue = (colorName: string) => {
    return colors[colorName] || DEFAULT_COLORS[colorName] || "";
  };

  const hslToHex = (hsl: string): string => {
    const parts = hsl.trim().split(/\s+/);
    if (parts.length !== 3) return "#000000";
    
    const h = parseFloat(parts[0]);
    const s = parseFloat(parts[1].replace("%", "")) / 100;
    const l = parseFloat(parts[2].replace("%", "")) / 100;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;

    let r = 0, g = 0, b = 0;

    if (h >= 0 && h < 60) {
      r = c; g = x; b = 0;
    } else if (h >= 60 && h < 120) {
      r = x; g = c; b = 0;
    } else if (h >= 120 && h < 180) {
      r = 0; g = c; b = x;
    } else if (h >= 180 && h < 240) {
      r = 0; g = x; b = c;
    } else if (h >= 240 && h < 300) {
      r = x; g = 0; b = c;
    } else if (h >= 300 && h < 360) {
      r = c; g = 0; b = x;
    }

    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);

    return `#${[r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    }).join("")}`;
  };

  const hexToHsl = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break;
        case g: h = ((b - r) / d + 2) * 60; break;
        case b: h = ((r - g) / d + 4) * 60; break;
      }
    }

    return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };

  const handleColorChange = (colorName: string, value: string) => {
    // Try to parse as hex first
    if (value.startsWith("#")) {
      const hex = value.replace("#", "");
      if (/^[0-9A-Fa-f]{6}$/.test(hex)) {
        const hsl = hexToHsl(value);
        updateColor(colorName, hsl);
        return;
      }
    }
    // Otherwise treat as HSL - normalize the format
    // Ensure it's in format "H S% L%" or "H S L"
    const normalized = value.trim();
    if (normalized) {
      updateColor(colorName, normalized);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Color Palette
            </CardTitle>
            <CardDescription>
              Edit theme colors - changes apply throughout the app
            </CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={resetAll}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-400px)]">
          <div className="space-y-4">
            {COLOR_GROUPS.map((group) => (
              <div key={group.group} className="border rounded-lg">
                <button
                  onClick={() => toggleGroup(group.group)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <span className="font-medium">{group.group}</span>
                  <span className="text-muted-foreground">
                    {expandedGroups.has(group.group) ? "−" : "+"}
                  </span>
                </button>
                {expandedGroups.has(group.group) && (
                  <div className="px-4 pb-4 space-y-3 pt-2">
                    {group.colors.map((color) => {
                      const currentValue = getColorValue(color.name);
                      const hexValue = hslToHex(currentValue);
                      const isOverridden = !!colors[color.name];

                      return (
                        <div key={color.name} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">
                              {color.label}
                            </label>
                            {isOverridden && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 px-2 text-xs"
                                onClick={() => resetColor(color.name)}
                              >
                                Reset
                              </Button>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <Input
                                type="text"
                                value={currentValue}
                                onChange={(e) =>
                                  handleColorChange(color.name, e.target.value)
                                }
                                placeholder="H S% L%"
                                className="font-mono text-sm pr-10"
                              />
                              <div
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded border border-border"
                                style={{
                                  backgroundColor: `hsl(${currentValue})`,
                                }}
                              />
                            </div>
                            <div className="relative w-24">
                              <Input
                                type="text"
                                value={hexValue}
                                onChange={(e) =>
                                  handleColorChange(color.name, e.target.value)
                                }
                                placeholder="#000000"
                                className="font-mono text-sm pr-8"
                              />
                              <div
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded border border-border"
                                style={{ backgroundColor: hexValue }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function ComponentEditor({ componentName }: { componentName: string }) {
  const { overrides, updateOverride, resetOverride } = useComponentOverrides();
  const override = overrides[componentName];
  const [baseClassName, setBaseClassName] = useState(override?.baseClassName || "");

  useEffect(() => {
    setBaseClassName(override?.baseClassName || "");
  }, [override]);

  const handleSave = () => {
    updateOverride(componentName, {
      baseClassName: baseClassName.trim() || undefined,
    });
  };

  const handleReset = () => {
    resetOverride(componentName);
    setBaseClassName("");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{componentName}</CardTitle>
            <CardDescription>
              Edit base classes that apply to all {componentName} components
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Apply
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Base Classes</label>
          <Input
            value={baseClassName}
            onChange={(e) => setBaseClassName(e.target.value)}
            placeholder="e.g., shadow-lg rounded-xl"
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Add Tailwind classes that will be applied to all {componentName} instances
          </p>
        </div>

        {/* Preview */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Preview</label>
          <div className="border border-border rounded-lg p-4 bg-muted/50">
            {componentName === "Button" && (
              <div className="flex flex-wrap gap-2">
                <Button>Default Button</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
              </div>
            )}
            {componentName === "Card" && (
              <Card className="w-full max-w-sm">
                <CardHeader>
                  <CardTitle>Card Preview</CardTitle>
                  <CardDescription>This is a preview card</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">Card content goes here</p>
                </CardContent>
              </Card>
            )}
            {componentName === "Input" && (
              <div className="space-y-2">
                <Input placeholder="Input preview" />
                <Input type="email" placeholder="Email input" />
              </div>
            )}
            {componentName === "Badge" && (
              <div className="flex flex-wrap gap-2">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
              </div>
            )}
            {componentName === "Avatar" && (
              <div className="flex gap-2">
                <Avatar>
                  <AvatarFallback>AB</AvatarFallback>
                </Avatar>
                <Avatar>
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    CD
                  </AvatarFallback>
                </Avatar>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ComponentShowcase() {
  return (
    <div className="space-y-8">
      {/* Buttons */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Buttons</h3>
        <div className="flex flex-wrap gap-2">
          <Button variant="default">Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
          <Button variant="destructive">Destructive</Button>
        </div>
      </div>

      {/* Cards */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Cards</h3>
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card description</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">Card content</p>
          </CardContent>
          <CardFooter>
            <Button>Action</Button>
          </CardFooter>
        </Card>
      </div>

      {/* Inputs */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Inputs</h3>
        <div className="space-y-2 max-w-md">
          <Input placeholder="Text input" />
          <Input type="email" placeholder="Email input" />
          <Input disabled placeholder="Disabled input" />
        </div>
      </div>

      {/* Badges */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Badges</h3>
        <div className="flex flex-wrap gap-2">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      </div>

      {/* Avatars */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Avatars</h3>
        <div className="flex gap-2">
          <Avatar>
            <AvatarFallback>AB</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback className="bg-primary text-primary-foreground">
              CD
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </div>
  );
}

export default function DesignPage() {
  const [selectedComponent, setSelectedComponent] = useState<string>("Button");
  const [activeTab, setActiveTab] = useState<"components" | "colors">("components");
  const { resetAll } = useComponentOverrides();

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Design System Editor
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Edit colors and components - changes apply throughout the app
              </p>
            </div>
            <div className="flex gap-2">
              <div className="inline-flex rounded-lg border border-border bg-card p-1">
                <button
                  onClick={() => setActiveTab("components")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === "components"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Components
                </button>
                <button
                  onClick={() => setActiveTab("colors")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === "colors"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Colors
                </button>
              </div>
              {activeTab === "components" && (
                <Button variant="outline" onClick={resetAll}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset All
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {activeTab === "components" ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Component Selector & Editor */}
            <div className="lg:col-span-1 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Select Component</CardTitle>
                  <CardDescription>Choose a component to edit</CardDescription>
                </CardHeader>
                <CardContent>
                  <Select value={selectedComponent} onValueChange={setSelectedComponent}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COMPONENTS.map((comp) => (
                        <SelectItem key={comp.name} value={comp.name}>
                          {comp.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <ComponentEditor componentName={selectedComponent} />
            </div>

            {/* Live Preview */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Live Preview</CardTitle>
                  <CardDescription>
                    See how your changes look across all component instances
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[calc(100vh-300px)]">
                    <ComponentShowcase />
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Color Editor */}
            <div className="lg:col-span-1">
              <ColorEditor />
            </div>

            {/* Live Preview */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Live Preview</CardTitle>
                  <CardDescription>
                    See how your color changes look across all components
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[calc(100vh-300px)]">
                    <ComponentShowcase />
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
