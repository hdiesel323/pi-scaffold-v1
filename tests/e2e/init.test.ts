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
import { execSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const initScript = join(process.cwd(), "init.sh");

describe("Greenfield init.sh E2E", () => {
  it("should create a fully structured project", () => {
    const parentDir = mkdtempSync(join(tmpdir(), "pi-greenfield-test-"));
    const projectName = "new-agent";
    const targetDir = join(parentDir, projectName);

    try {
      // Run init.sh
      execSync(`bash ${initScript} ${projectName} ${parentDir}`, {
        stdio: "inherit",
        env: { ...process.env, PATH: `${process.env.PATH}:/usr/bin:/bin` }
      });

      // 1. Verify existence of core assets
      expect(existsSync(targetDir)).toBe(true);
      expect(existsSync(join(targetDir, ".pi/agents/teams.yaml"))).toBe(true);
      expect(existsSync(join(targetDir, "extensions/minimal.ts"))).toBe(true);
      expect(existsSync(join(targetDir, "justfile"))).toBe(true);
      expect(existsSync(join(targetDir, "package.json"))).toBe(true);
      expect(existsSync(join(targetDir, ".git"))).toBe(true);

      // 2. Verify placeholder replacement
      const pkg = JSON.parse(readFileSync(join(targetDir, "package.json"), "utf-8"));
      expect(pkg.name).toBe("new-agent");

      const readme = readFileSync(join(targetDir, "README.md"), "utf-8");
      expect(readme).toContain("new-agent");
      expect(readme).not.toContain("{{PROJECT_NAME}}");

      // 3. Verify doctor.sh passes in the new project
      // Mocking environment for doctor
      const doctorResult = execSync(`bash ./doctor.sh`, {
        cwd: targetDir,
        encoding: "utf-8",
        env: { 
          ...process.env, 
          HOME: targetDir // ensure auth checks don't hit real home
        }
      });
      expect(doctorResult).toContain("success");

    } finally {
      rmSync(parentDir, { recursive: true, force: true });
    }
  });
});
