# Welcome to Pi Swarm: Employee Onboarding Guide

> "Transform single-agent interactions into coordinated swarm intelligence."

Welcome to the **Pi Swarm** ecosystem. This platform is designed to scale your technical capabilities by deploying an autonomous multi-agent swarm across your development lifecycle.

## 🚀 The Vision: Corporate-Scale Intelligence
Pi Swarm isn't just a coding assistant; it's a **56-agent corporate swarm** organized into 7 functional divisions:
- **Engineering (22)**: The core implementation force.
- **Security/QA (5)**: Hardening and validation.
- **Marketing (6)**: Growth and reach.
- **Product (4)**: Scoping and vision.
- **Sales/Ops (6)**: Revenue and process.
- **Data (4)**: Insights and intelligence.
- **Design (4)**: UX/UI and motion.
- **Orchestrators (5)**: High-level management and workflow execution.

## 🛠 Prerequisites
Ensure you have these tools installed before proceeding:
- **Bun**: `curl -fsSL https://bun.sh/install | bash`
- **pi**: `go install github.com/mariozechner/pi-coding-agent@latest`
- **just**: `brew install just`
- **gh**: `brew install gh` (GitHub CLI)

## 🏁 Quick Start

### Step 1: Clone the Swarm
Clone the toolkit to your local system:
```bash
git clone https://github.com/hdiesel323/pi-swarm.git ~/pi-swarm
```

### Step 2: Initialize Your Project
Choose the path that fits your current work:
- **New Project**: `~/pi-swarm/init.sh my-new-swarm`
- **Existing Project**: `cd /path/to/project && ~/pi-swarm/init.sh --brownfield .`

### Step 3: Health Check & Auth
Verify your environment and connect your provider accounts:
```bash
just doctor
# Inside Pi, discover models first, then connect the accounts you need:
pi --list-models anthropic
pi --list-models openai
pi --list-models google
/login <provider>
```

### Step 4: Launch the Swarm
Fire up the full team stack:
```bash
just launch-all      # Standard team stack
# OR
just launch-scrum    # Scrum-focused task execution
```

## ⌨️ Key Commands
- `/plan`: Initiate an interactive requirements discovery with the Project Planner.
- `/status`: Check the current sprint health and task status via Scrum Master.
- `/next`: Get the next logical task in the backlog.
- `/catalog`: Browse the 56-agent roster and their capabilities.
- `/spork`: Native support for parallel task execution via Git worktrees.
- `/wrap`: Finalize your session, sync knowledge, and archive logs.

## 🏥 Support
Stuck? Run `just doctor` first. If issues persist, check the [Troubleshooting Guide](docs/TROUBLESHOOTING.md).

---
*Pi Swarm v1.2.1 | MIT License*
