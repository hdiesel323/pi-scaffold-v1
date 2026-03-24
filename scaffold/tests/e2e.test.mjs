import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, existsSync, writeFileSync, chmodSync, readdirSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const initScript = path.join(repoRoot, "init.sh");
const exportV1Script = path.join(repoRoot, "scripts", "export-v1.sh");
const agencyInstaller = path.join(repoRoot, "v1", "bolt-ons", "agency-full", "install.sh");

function makeTempDir(prefix) {
	return mkdtempSync(path.join(tmpdir(), prefix));
}

function run(cmd, args, options = {}) {
	try {
		return execFileSync(cmd, args, {
			cwd: repoRoot,
			encoding: "utf8",
			stdio: ["ignore", "pipe", "pipe"],
			...options,
		});
	} catch (error) {
		const stdout = error.stdout || "";
		const stderr = error.stderr || "";
		throw new Error(
			`Command failed: ${cmd} ${args.join(" ")}\n` +
			`exit=${error.status}\nstdout:\n${stdout}\nstderr:\n${stderr}`,
		);
	}
}

function writeExecutable(filePath, content) {
	writeFileSync(filePath, content);
	chmodSync(filePath, 0o755);
}

function read(filePath) {
	return readFileSync(filePath, "utf8");
}

function scaffoldProject(projectName, env = {}) {
	const parentDir = makeTempDir("pi-scaffold-project-");
	run("bash", [initScript, projectName, parentDir], {
		env: { ...process.env, ...env },
	});
	return path.join(parentDir, projectName);
}

test("init.sh prints usage when required args are missing", () => {
	const output = run("bash", [initScript], { env: { ...process.env, PATH: "/usr/bin:/bin" } });
	assert.match(output, /Usage:/);
});

test("init.sh fails when the target directory already exists", () => {
	const parentDir = makeTempDir("pi-scaffold-existing-");
	const targetDir = path.join(parentDir, "existing-project");
	mkdirSync(targetDir, { recursive: true });

	assert.throws(
		() => run("bash", [initScript, "existing-project", parentDir], { env: { ...process.env, PATH: "/usr/bin:/bin" } }),
		/Directory already exists/,
	);
});

test("init.sh creates a complete scaffold with hidden assets and replaced placeholders", () => {
	const projectDir = scaffoldProject("My Test Agent", {
		PATH: "/usr/bin:/bin",
	});

	assert.equal(existsSync(projectDir), true);
	assert.equal(existsSync(path.join(projectDir, ".git")), true);
	assert.equal(existsSync(path.join(projectDir, ".pi", "agents", "teams.yaml")), true);
	assert.equal(existsSync(path.join(projectDir, ".pi", "themes", "synthwave.json")), true);
	assert.equal(existsSync(path.join(projectDir, ".github", "workflows", "ci.yml")), true);
	assert.equal(existsSync(path.join(projectDir, ".claude", "commands", "prime.md")), true);

	const packageJson = JSON.parse(read(path.join(projectDir, "package.json")));
	assert.equal(packageJson.name, "my-test-agent");
	assert.equal(packageJson.dependencies["@mariozechner/pi-coding-agent"], "^0.62.0");
	assert.equal(packageJson.dependencies["@mariozechner/pi-tui"], "^0.62.0");
	assert.equal(packageJson.dependencies["@sinclair/typebox"], "^0.34.48");
	assert.equal(packageJson.dependencies["js-yaml"], "^4.1.1");

	const doctorMode = statSync(path.join(projectDir, "doctor.sh")).mode;
	const teamMode = statSync(path.join(projectDir, "bin", "team-pi")).mode;
	assert.ok((doctorMode & 0o111) !== 0);
	assert.ok((teamMode & 0o111) !== 0);

	const claudeDoc = read(path.join(projectDir, "CLAUDE.md"));
	assert.match(claudeDoc, /# My Test Agent/);

	const readme = read(path.join(projectDir, "README.md"));
	assert.match(readme, /^# My Test Agent — Production-Ready Pi Agent Extensions/m);
	assert.doesNotMatch(readme, /\{\{PROJECT_NAME\}\}/);

	const pureFocus = read(path.join(projectDir, "extensions", "pure-focus.ts"));
	assert.match(pureFocus, /Usage: pi -e extensions\/pure-focus\.ts/);
});

test("generated just recipes resolve the documented extension stacks", () => {
	const projectDir = scaffoldProject("recipe-check", {
		PATH: "/usr/bin:/bin",
	});
	const tempRoot = makeTempDir("pi-scaffold-recipes-");
	const fakeBin = path.join(tempRoot, "bin");
	const markerFile = path.join(tempRoot, "pi.log");
	mkdirSync(fakeBin, { recursive: true });

	writeExecutable(
		path.join(fakeBin, "pi"),
		`#!/usr/bin/env bash
printf '%s\\n' "$*" >> "${markerFile}"
exit 0
`,
	);

	const env = { ...process.env, PATH: `${fakeBin}:${process.env.PATH}` };
	const runJust = (recipe) =>
		run("just", ["--justfile", path.join(projectDir, "justfile"), "--working-directory", projectDir, recipe], { env });

	runJust("ext-minimal");
	runJust("ext-agent-team");
	runJust("ext-health-check");
	runJust("ext-pi-pi");
	runJust("ext-sentry-agent-team");

	const invocations = read(markerFile);
	assert.match(invocations, /-e extensions\/minimal\.ts -e extensions\/theme-cycler\.ts/);
	assert.match(invocations, /-e extensions\/agent-team\.ts -e extensions\/theme-cycler\.ts/);
	assert.match(invocations, /-e extensions\/health-check\.ts -e extensions\/sentry\.ts -e extensions\/minimal\.ts/);
	assert.match(invocations, /-e extensions\/pi-pi\.ts -e extensions\/theme-cycler\.ts/);
	assert.match(invocations, /-e extensions\/sentry\.ts -e extensions\/agent-team\.ts -e extensions\/theme-cycler\.ts/);
});

test("init.sh invokes bun install when bun is available on PATH", () => {
	const tempRoot = makeTempDir("pi-scaffold-bun-");
	const fakeBin = path.join(tempRoot, "bin");
	const markerFile = path.join(tempRoot, "bun.log");
	mkdirSync(fakeBin, { recursive: true });

	writeExecutable(
		path.join(fakeBin, "bun"),
		`#!/usr/bin/env bash
printf '%s\\n' "$*" > "${markerFile}"
exit 0
`,
	);

	const parentDir = path.join(tempRoot, "projects");
	mkdirSync(parentDir, { recursive: true });

	run("bash", [initScript, "bun-check", parentDir], {
		env: {
			...process.env,
			PATH: `${fakeBin}:/usr/bin:/bin`,
		},
	});

	assert.equal(existsSync(markerFile), true);
	assert.match(read(markerFile), /install --silent/);
});

test("export-v1.sh creates a standalone starter repo and prints push instructions", () => {
	const parentDir = makeTempDir("pi-scaffold-export-");

	const output = run("bash", [exportV1Script, "team-pi", parentDir], {
		env: {
			...process.env,
			PATH: "/usr/bin:/bin",
		},
	});

	const projectDir = path.join(parentDir, "team-pi");
	assert.equal(existsSync(projectDir), true);
	assert.equal(existsSync(path.join(projectDir, ".git")), true);
	assert.match(output, /Standalone v1 starter repo exported to:/);
	assert.match(output, /git remote add origin <new-repo-url>/);
});

test("generated scaffold docs and CI use model discovery and current structure checks", () => {
	const projectDir = scaffoldProject("docs-check", {
		PATH: "/usr/bin:/bin",
	});

	const readme = read(path.join(projectDir, "README.md"));
	assert.match(readme, /pi --list-models/);
	assert.doesNotMatch(readme, /minimax\/chatgpt-o3-mini/);
	assert.doesNotMatch(readme, /zai\/Bests/);
	assert.doesNotMatch(readme, /groq\/llama-3\.3-70b\b/);

	const envSample = read(path.join(projectDir, ".env.sample"));
	assert.match(envSample, /discover models with: pi --list-models minimax/);
	assert.match(envSample, /discover models with: pi --list-models zai/);

	const ci = read(path.join(projectDir, ".github", "workflows", "ci.yml"));
	assert.match(ci, /ls -la \.pi\//);
	assert.match(ci, /ls -la \.pi\/agents\//);
	assert.doesNotMatch(ci, /ls -la lib\//);
});

test("agency-full installer creates agent-team compatible teams.yaml and agent files", () => {
	const tempRoot = makeTempDir("pi-scaffold-agency-");
	const targetDir = path.join(tempRoot, "target");
	const fakeBin = path.join(tempRoot, "bin");
	mkdirSync(targetDir, { recursive: true });
	mkdirSync(fakeBin, { recursive: true });

	writeExecutable(
		path.join(fakeBin, "gh"),
		`#!/usr/bin/env bash
exit 0
`,
	);

	writeExecutable(
		path.join(fakeBin, "curl"),
		`#!/usr/bin/env bash
out=""
url=""
while [ "$#" -gt 0 ]; do
  case "$1" in
    -o)
      out="$2"
      shift 2
      ;;
    -s|-S|-L|-SL|-sS|-sSL)
      shift
      ;;
    *)
      url="$1"
      shift
      ;;
  esac
done
name="$(basename "$out" .md)"
cat > "$out" <<EOF
---
name: $name
description: fixture for $name
tools: read,grep,find,ls
---
Fixture body for $name
EOF
`,
	);

	run("bash", [agencyInstaller, targetDir], {
		env: {
			...process.env,
			PATH: `${fakeBin}:/usr/bin:/bin`,
		},
	});

	const teamsYaml = read(path.join(targetDir, ".pi", "agents", "teams.yaml"));
	assert.match(teamsYaml, /^engineering:\n/m);
	assert.match(teamsYaml, /^sales:\n/m);
	assert.doesNotMatch(teamsYaml, /^teams:\n/m);

	const engineeringDir = path.join(targetDir, ".pi", "agents", "engineering");
	const salesDir = path.join(targetDir, ".pi", "agents", "sales");
	assert.equal(existsSync(path.join(engineeringDir, "frontend-developer.md")), true);
	assert.equal(existsSync(path.join(engineeringDir, "backend-architect.md")), true);
	assert.equal(existsSync(path.join(salesDir, "pipeline-analyst.md")), true);

	const engineeringFiles = readdirSync(engineeringDir).filter((file) => file.endsWith(".md"));
	assert.ok(engineeringFiles.length >= 7);
});

test("local Pi model discovery works for documented provider-scoped commands when pi is installed", () => {
	const hasPi = spawnSync("bash", ["-lc", "command -v pi >/dev/null 2>&1"]);
	if (hasPi.status !== 0) {
		return;
	}

	const minimaxDir = makeTempDir("pi-models-minimax-");
	const zaiDir = makeTempDir("pi-models-zai-");
	const groqDir = makeTempDir("pi-models-groq-");

	const minimaxResult = spawnSync("pi", ["--list-models", "minimax"], {
		cwd: repoRoot,
		encoding: "utf8",
		env: { ...process.env, PI_CODING_AGENT_DIR: minimaxDir, MINIMAX_API_KEY: "dummy" },
	});
	const minimaxModels = `${minimaxResult.stdout || ""}${minimaxResult.stderr || ""}`;
	assert.match(minimaxModels, /minimax\s+MiniMax-M2/);

	const zaiResult = spawnSync("pi", ["--list-models", "zai"], {
		cwd: repoRoot,
		encoding: "utf8",
		env: { ...process.env, PI_CODING_AGENT_DIR: zaiDir, ZAI_API_KEY: "dummy" },
	});
	const zaiModels = `${zaiResult.stdout || ""}${zaiResult.stderr || ""}`;
	assert.match(zaiModels, /zai\s+glm-/);

	const groqResult = spawnSync("pi", ["--list-models", "groq"], {
		cwd: repoRoot,
		encoding: "utf8",
		env: { ...process.env, PI_CODING_AGENT_DIR: groqDir, GROQ_API_KEY: "dummy" },
	});
	const groqModels = `${groqResult.stdout || ""}${groqResult.stderr || ""}`;
	assert.match(groqModels, /groq\s+/);
});
