/**
 * Pi Scaffold (pi-vs-cc)
 * License: MIT
 * Copyright (c) 2026 Pi Scaffold Maintainers
 */
/**
 * Pi Scaffold (pi-vs-cc)
 * License: MIT
 * Copyright (c) 2026 Pi Scaffold Maintainers
 */
import { describe, it, expect } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const REQUIRED_COLOR_KEYS = [
  "accent", "border", "borderAccent", "borderMuted",
  "success", "error", "warning", "muted", "dim", "text",
  "thinkingText", "selectedBg", "userMessageBg", "userMessageText",
  "customMessageBg", "customMessageText", "customMessageLabel",
  "toolPendingBg", "toolSuccessBg", "toolErrorBg", "toolTitle", "toolOutput",
  "mdHeading", "mdLink", "mdLinkUrl", "mdCode", "mdCodeBlock",
  "mdCodeBlockBorder", "mdQuote", "mdQuoteBorder", "mdHr", "mdListBullet",
  "toolDiffAdded", "toolDiffRemoved", "toolDiffContext",
  "syntaxComment", "syntaxKeyword", "syntaxFunction", "syntaxVariable",
  "syntaxString", "syntaxNumber", "syntaxType", "syntaxOperator",
  "syntaxPunctuation", "thinkingOff", "thinkingMinimal", "thinkingLow",
  "thinkingMedium", "thinkingHigh", "thinkingXhigh", "bashMode"
];

describe("Theme Validation", () => {
  const themesDir = join(process.cwd(), ".pi/themes");
  const files = readdirSync(themesDir).filter((file) => file.endsWith(".json"));

  for (const file of files) {
    it(`should be a valid theme: ${file}`, () => {
      const content = readFileSync(join(themesDir, file), "utf-8");
      const theme = JSON.parse(content);

      expect(theme.name).toBeDefined();
      expect(theme.colors).toBeDefined();
      expect(theme.vars).toBeDefined();

      const colorKeys = Object.keys(theme.colors);
      for (const key of REQUIRED_COLOR_KEYS) {
        expect(colorKeys).toContain(key);
        const value = theme.colors[key];
        // Value should be a hex code or a reference to a var
        expect(typeof value).toBe("string");
        expect(value.length).toBeGreaterThan(0);
      }
    });
  }
});
