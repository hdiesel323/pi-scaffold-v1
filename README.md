# Pi Scaffold — Production-Ready Pi Agent Extensions

> "There are many coding agents, but this one is mine."

A comprehensive Pi Coding Agent toolkit for the team. This repository provides standard extensions, agents, and themes that can be "injected" into any project you are working on.

**Built on [Pi Agent](https://pi.dev) by [Mario Zechner](https://github.com/disler).**

---

## 🚀 Quick Start (Zero to Pi)

Follow these steps to get Pi running in your current project.

### Step 1: One-Time Setup (The Toolkit)
First, clone this toolkit to your home directory. You only need to do this **once** on your machine.
```bash
git clone https://github.com/hdiesel323/pi-scaffold-v1.git ~/pi-scaffold
```

### Step 2: Inject Pi into your Project
Now, go to the project you are actually working on (e.g., your website or API) and run the injector:
```bash
# 1. Go to your project
cd ~/Documents/my-work-project

# 2. Run the injector from the toolkit you just cloned
~/pi-scaffold/init.sh --brownfield .
```
*This command safely adds the `.pi/` config and `extensions/` to your project without touching your code.*

### Step 3: Configure & Launch
```bash
# 1. Add your API keys (Anthropic, OpenAI, etc.)
cp .env.sample .env
# Open .env in your editor and paste your keys

# 2. Verify everything is correct
just doctor

# 3. Start the team stack
just team-pi
```

---

## 🏥 Diagnostic Tool (`just doctor`)
The `doctor` command verifies:
- Are the required tools (`pi`, `bun`, `just`) installed?
- Is your `.env` file set up with API keys?
- Are the team extensions (`extensions/`) present?

If something isn't working, run `just doctor` and it will tell you exactly what is missing.

---

## 🛠 Team Launcher (`just team-pi`)
The `team-pi` command launches Pi with the team's standard configuration:
- **agent-team**: A multi-agent system (Scout, Planner, Builder, Reviewer).
- **sentry**: Automatically reports errors so we can fix them.
- **health-check**: Monitors your API connection status.

---

## Prerequisites (Install these first)

| Tool | Purpose | Install |
|------|---------|---------|
| **Bun** | Runtime | [bun.sh](https://bun.sh) |
| **just** | Task runner | `brew install just` |
| **pi** | The Agent | `go install github.com/mariozechner/pi-coding-agent@latest` |

---

## Multi-Model Support

Pi supports **20+ providers**. Add your keys to `.env` to use them:

| Provider | Env Var | Example Model |
|----------|---------|---------------|
| Anthropic | `ANTHROPIC_API_KEY` | `claude-3-5-sonnet` |
| OpenAI | `OPENAI_API_KEY` | `gpt-4o` |
| Google | `GEMINI_API_KEY` | `gemini-2.0-flash` |

---

## Detailed Brownfield Guide (Existing Projects)

If you already have a repository and want to add Pi without starting over:

1. **Clone the Toolkit**: `git clone https://github.com/hdiesel323/pi-scaffold-v1.git ~/pi-scaffold`
2. **Navigate to your Repo**: `cd ~/path/to/your-existing-repo`
3. **Run the Injector**: `~/pi-scaffold/init.sh --brownfield .`
4. **Setup Env**: `cp .env.sample .env` and add your keys.
5. **Install Deps**: `bun install` (the injector does this automatically if you have Bun).
6. **Launch**: `just team-pi`

---

## Extension Reference
... (rest of the file)
