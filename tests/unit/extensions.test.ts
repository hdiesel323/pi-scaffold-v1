/**
 * Pi Swarm
 * License: MIT
 * Copyright (c) 2026 Pi Scaffold Maintainers
 */
/**
 * Pi Swarm
 * License: MIT
 * Copyright (c) 2026 Pi Scaffold Maintainers
 */
import { describe, it, expect } from "bun:test";
import { readdirSync } from "node:fs";
import { join } from "node:path";

describe("Extension Import Validation", () => {
  const extensionsDir = join(process.cwd(), "extensions");
  const files = readdirSync(extensionsDir).filter(
    (file) => file.endsWith(".ts") && file !== "themeMap.ts"
  );

  for (const file of files) {
    it(`should be able to import extension: ${file}`, async () => {
      const extensionPath = join(extensionsDir, file);
      // Dynamic import to check for syntax errors and basic dependency resolution
      const extension = await import(extensionPath);
      
      // Basic check that it has a default export which is a function (Pi extension pattern)
      expect(typeof extension.default).toBe("function");
    });
  }
});
