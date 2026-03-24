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
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";

describe("Agent Validation", () => {
  const agentsDir = join(process.cwd(), ".pi/agents");
  
  // 1. Validate top-level .md agent files
  const mdFiles = readdirSync(agentsDir).filter(f => f.endsWith(".md"));
  for (const file of mdFiles) {
    it(`should be a valid agent: ${file}`, () => {
      const raw = readFileSync(join(agentsDir, file), "utf-8");
      // Check for frontmatter
      const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
      expect(match).not.toBeNull();
      
      const frontmatter = parseYaml(match![1]);
      const systemPrompt = match![2].trim();

      expect(frontmatter.name).toBeDefined();
      expect(frontmatter.description).toBeDefined();
      expect(systemPrompt.length).toBeGreaterThan(0);
    });
  }

  // 2. Validate teams.yaml
  it("teams.yaml should be valid", () => {
    const teamsPath = join(agentsDir, "teams.yaml");
    expect(existsSync(teamsPath)).toBe(true);
    const content = readFileSync(teamsPath, "utf-8");
    const teams = parseYaml(content);
    
    expect(typeof teams).toBe("object");
    for (const teamName in teams) {
      expect(Array.isArray(teams[teamName])).toBe(true);
      expect(teams[teamName].length).toBeGreaterThan(0);
    }
  });

  // 3. Validate pi-pi expert agents
  const piPiDir = join(agentsDir, "pi-pi");
  if (existsSync(piPiDir)) {
    const expertFiles = readdirSync(piPiDir).filter(f => f.endsWith(".md"));
    for (const file of expertFiles) {
      it(`pi-pi expert should be valid: ${file}`, () => {
        const raw = readFileSync(join(piPiDir, file), "utf-8");
        const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
        expect(match).not.toBeNull();
        
        const frontmatter = parseYaml(match![1]);
        expect(frontmatter.name).toBeDefined();
        // pi-orchestrator might have a template body, others should have prompts
      });
    }
  }
});
