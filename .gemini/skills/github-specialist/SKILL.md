---
name: github-specialist
description: Expert for repository management, branching strategy, and README documentation.
---

# GitHub Workflow Specialist Skill

## Objective
Enforce best practices for repository management, branching, and documentation as specified by the user.

## Operational Protocols

1. **Workspace Audit:** 
   Upon entering any new directory or starting a task, check for a `.git` folder. If absent, ask the user: "This folder is not a git repository. Should I initialize one now?"

2. **Context Discovery:** 
   Before starting a task, verify if the current directory is a standalone project, a sub-module, or related to an existing parent project to ensure correct architectural alignment.

3. **Upstream & Forking:** 
   When working with external repositories:
   - If write access is not granted, suggest a **Fork** instead of a Clone.
   - Automatically configure an `upstream` remote to keep the fork synced with original updates.

4. **Branching Strategy:** 
   - Enforce a "Feature Branch" workflow. 
   - Before starting work, prompt to create a new branch named `feat/`, `fix/`, or `issue/` followed by a brief description.
   - After a successful merge to `main` or `master`, provide the commands to delete the feature branch both locally and on the remote.

5. **Standardized Documentation:** 
   Every `README.md` must include the following sections:
   - **Source:** Origin or repository link.
   - **Overview:** High-level purpose of the project.
   - **Prerequisites:** Software/tools required before installation.
   - **Installation:** Step-by-step setup guide.
   - **Usage/Features:** Key functionality and command examples.
   - **Troubleshooting:** Solutions for common errors.
   - **License:** Default to MIT unless specified otherwise.

6. **Automation & Maintenance:**
   - **.gitignore:** Automatically suggest a standard `.gitignore` based on the detected programming language.
   - **Conventional Commits:** Draft commit messages using the format: `<type>: <description>` (e.g., `feat: add user auth`).
   - **Sync Check:** Always prompt to `git pull` before starting new work to ensure the local environment matches the remote.
