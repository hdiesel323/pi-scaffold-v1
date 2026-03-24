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
import { execSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync, mkdtempSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { tmpdir } from "node:os";

const initScript = join(process.cwd(), "init.sh");

describe("Brownfield init.sh E2E", () => {
  it("should merge configuration without overwriting", () => {
    const targetDir = mkdtempSync(join(tmpdir(), "pi-brownfield-test-"));
    
    // 1. Create existing project structure
    const originalPkg = { name: "existing-app", version: "1.2.3" };
    writeFileSync(join(targetDir, "package.json"), JSON.stringify(originalPkg, null, 2));
    
    const originalReadme = "# Original Project";
    writeFileSync(join(targetDir, "README.md"), originalReadme);
    
    const originalJustfile = `default:
    @echo hello`;
    writeFileSync(join(targetDir, "justfile"), originalJustfile);

    try {
      // 2. Run --brownfield
      execSync(`bash ${initScript} --brownfield ${targetDir}`, {
        stdio: "inherit",
        env: { ...process.env }
      });

      // 3. Verify Pi assets were added
      expect(existsSync(join(targetDir, ".pi"))).toBe(true);
      expect(existsSync(join(targetDir, "extensions"))).toBe(true);
      expect(existsSync(join(targetDir, "bin", "team-pi"))).toBe(true);
      expect(existsSync(join(targetDir, ".env.sample"))).toBe(true);

      // 4. Verify existing files were preserved
      const pkg = JSON.parse(readFileSync(join(targetDir, "package.json"), "utf-8"));
      expect(pkg.name).toBe("existing-app");
      expect(pkg.version).toBe("1.2.3");

      const readme = readFileSync(join(targetDir, "README.md"), "utf-8");
      expect(readme).toBe(originalReadme);

      // 5. Verify justfile was appended
      const justfile = readFileSync(join(targetDir, "justfile"), "utf-8");
      expect(justfile).toContain("default:");
      expect(justfile).toContain("# ── Pi Extension Stacks");

      const dryRun = spawnSync("just", ["--justfile", join(targetDir, "justfile"), "--working-directory", targetDir, "--dry-run", "team-pi"], {
        encoding: "utf-8",
      });
      expect(`${dryRun.stdout}${dryRun.stderr}`).toContain("bash ./bin/team-pi");

    } finally {
      rmSync(targetDir, { recursive: true, force: true });
    }
  });
});
