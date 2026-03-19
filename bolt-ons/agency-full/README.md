# Agency Full Bolt-On

> Bolt on 100+ specialized AI agents to your Pi project

This bolt-on integrates the [agency-agents](https://github.com/msitarzewski/agency-agents) collection (54k stars) into your Pi scaffold.

## What's Included

### Engineering Division (9 agents)
- Frontend Developer
- Backend Architect
- Mobile App Builder
- AI Engineer
- DevOps Automator
- Code Reviewer
- Security Engineer
- Database Optimizer
- Git Workflow Master

### Sales Division (4 agents)
- Outbound Strategist
- Deal Strategist
- Pipeline Analyst
- Account Strategist

### Design Division (2 agents)
- UI Designer
- UX Researcher

### Marketing Division (2 agents)
- Growth Hacker
- SEO Specialist

### Product Division (2 agents)
- Sprint Prioritizer
- Trend Researcher

### Testing Division (2 agents)
- Evidence Collector
- Accessibility Auditor

### Specialized Division (2 agents)
- MCP Builder
- Document Generator

**Total: 23 core agents** (can expand to 100+)

## Installation

### Option 1: Fresh Project

```bash
# Clone the scaffold
git clone https://github.com/hdiesel323/pi-scaffold-v1.git my-agency
cd my-agency

# Install the agency bolt-on
cd bolt-ons/agency-full
./install.sh ../../..

# Run with agency
just ext-agent-team
```

### Option 2: Existing Project

```bash
cd /your-existing-project

# Copy the bolt-on
cp -r ~/path/to/scaffold/bolt-ons/agency-full ./agency-bolt-on

# Run the installer
cd agency-bolt-on
./install.sh ..
```

### Option 3: Direct Clone

```bash
# Clone the full agency-agents repo directly
git clone https://github.com/msitarzewski/agency-agents.git agency-agents

# Copy agents to your Pi project
cp -r agency-agents/engineering/* .pi/agents/engineering/
cp -r agency-agents/sales/* .pi/agents/sales/
# ... continue for other divisions
```

## Usage

After installation:

```bash
# Start Pi with agent-team extension
pi -e extensions/agent-team.ts -e extensions/theme-cycler.ts

# Use /agents-team to select a team
# Select "engineering" for dev tasks
# Select "sales" for sales tasks
# etc.
```

## Teams

The bolt-on creates teams in `.pi/agents/teams.yaml`:

| Team | Agents | Use Case |
|------|--------|----------|
| engineering | 9 | Development, architecture, code review |
| sales | 4 | Outbound, deals, pipeline |
| design | 2 | UI/UX design |
| marketing | 2 | Growth, SEO |
| product | 2 | Prioritization, research |
| testing | 2 | QA, accessibility |
| specialized | 2 | MCP, docs |

## Adding More Agents

The install script only fetches core agents. To add more:

```bash
# Edit install.sh and add more fetch_agent lines
./install.sh /your/project
```

Or manually:

```bash
gh api msitarzewski/agency-agents/contents/MARKETING -q '.[].name'
# Then fetch any you want
```

## Credits

- [agency-agents](https://github.com/msitarzewski/agency-agents) — 54k stars of AI agent personas
- [Pi Coding Agent](https://pi.dev) — The CLI tool this scaffold extends
