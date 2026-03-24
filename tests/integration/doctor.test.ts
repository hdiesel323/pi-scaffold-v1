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
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { mkdtempSync, writeFileSync, mkdirSync, chmodSync } from "node:fs";
import { tmpdir } from "node:os";

const doctorPath = join(process.cwd(), "doctor.sh");

function runDoctor(cwd: string, env: Record<string, string> = {}) {
  return spawnSync("bash", [doctorPath], {
    cwd,
    env: { ...process.env, ...env },
    encoding: "utf-8",
  });
}

describe("doctor.sh integration", () => {
  it("should fail (exit 1) in an empty directory without tools", () => {
    const tmp = mkdtempSync(join(tmpdir(), "pi-doctor-test-fail-"));
    // Use an empty PATH to simulate missing tools
    const result = runDoctor(tmp, { PATH: "/usr/bin:/bin" });
    
    expect(result.status).toBe(1);
    expect(result.stdout).toContain("error");
    expect(result.stdout).toContain("pi is missing");
  });

  it("should succeed (exit 0) when tools and assets are present", () => {
    const tmp = mkdtempSync(join(tmpdir(), "pi-doctor-test-pass-"));
    
    // 1. Mock bin directory with fake tools
    const binDir = join(tmp, "bin");
    mkdirSync(binDir);
    const mockTool = (name: string) => {
      const p = join(binDir, name);
      writeFileSync(p, `#!/bin/sh
echo mock`);
      chmodSync(p, 0o755);
    };
    mockTool("pi");
    mockTool("bun");
    mockTool("just");
    mockTool("gh");
    mockTool("sqlite3");

    // 2. Mock required project directories
    mkdirSync(join(tmp, ".pi"));
    mkdirSync(join(tmp, ".claude"));
    mkdirSync(join(tmp, "extensions"));

    // 3. Mock auth (.env)
    writeFileSync(join(tmp, ".env"), "ANTHROPIC_API_KEY=sk-ant-test-key-long-enough");

    const result = runDoctor(tmp, { PATH: `${binDir}:/usr/bin:/bin` });
    
    expect(result.stdout).toContain("success");
    expect(result.status).toBe(0);
  });

  it("should fail when dirs are missing", () => {
    const tmp = mkdtempSync(join(tmpdir(), "pi-doctor-test-warn-"));
    // Use an empty PATH to simulate missing tools
    const result = runDoctor(tmp);
    
    expect(result.stdout).toContain("directory missing");
    expect(result.status).toBe(1);
  });
});
