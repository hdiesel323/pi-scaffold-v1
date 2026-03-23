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
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, rmSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const initScript = join(process.cwd(), "init.sh");

describe("init.sh Idempotency E2E", () => {
  it("should not append recipes to justfile multiple times", () => {
    const targetDir = mkdtempSync(join(tmpdir(), "pi-idempotency-test-"));
    writeFileSync(join(targetDir, "justfile"), "default:
    @echo hello");

    try {
      // 1. First run
      execSync(`bash ${initScript} --brownfield ${targetDir}`, { env: { ...process.env } });
      const firstRunJustfile = readFileSync(join(targetDir, "justfile"), "utf-8");
      
      const occurrences = (firstRunJustfile.match(/# ── Pi Extension Stacks/g) || []).length;
      expect(occurrences).toBe(1);

      // 2. Second run
      execSync(`bash ${initScript} --brownfield ${targetDir}`, { env: { ...process.env } });
      const secondRunJustfile = readFileSync(join(targetDir, "justfile"), "utf-8");

      // Verify still only one occurrence
      const secondOccurrences = (secondRunJustfile.match(/# ── Pi Extension Stacks/g) || []).length;
      expect(secondOccurrences).toBe(1);
      
      // Verify file content hasn't grown unexpectedly
      expect(secondRunJustfile.length).toBe(firstRunJustfile.length);

    } finally {
      rmSync(targetDir, { recursive: true, force: true });
    }
  });
});
