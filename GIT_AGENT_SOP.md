# Git + Agent Development SOP

This document defines the default workflow for developing this repository with an AI coding agent.

## 1. Goals

- Keep `main` stable and recoverable
- Make every change traceable
- Reduce scope creep during a development round
- Ensure the user and the agent work from the same rules

## 2. Default Branch Model

- `main`
  - Stable branch
  - Only merge tested work
  - Always keep it in a runnable state

- `feat/<name>`
  - New feature work
  - Examples:
    - `feat/import-flow`
    - `feat/crop-tool`
    - `feat/resize-export`

- `fix/<name>`
  - Bug fixes
  - Examples:
    - `fix/export-crash`
    - `fix/compress-quality`

- `refactor/<name>`
  - Internal cleanup only
  - No new product behavior unless explicitly approved

## 3. Golden Rules

- Never develop directly on `main`
- One round = one branch = one goal
- Do not mix UI redesign, bug fixes, and architecture changes in the same round unless explicitly approved
- Do not package multiple “test builds” in parallel and leave them all around
- Every round must end with:
  - a working branch
  - a clear test checklist
  - one testable build path if packaging is needed

## 4. Standard Workflow

### Step 1: Start from latest main

```bash
git switch main
git pull
```

### Step 2: Create a new branch

```bash
git switch -c feat/<short-name>
```

Examples:

```bash
git switch -c feat/convert-mode
git switch -c fix/crop-drag
```

### Step 3: Define the round before coding

Before the agent writes code, the user should define:

- what this round includes
- what this round excludes
- how success is checked

Use this template:

```text
本轮目标：
1. ...
2. ...

不要改：
1. ...
2. ...

完成标准：
1. ...
2. ...
3. ...
```

### Step 4: Implement one slice completely

For each round, finish one slice end-to-end:

- UI for that slice
- business logic for that slice
- error handling for that slice
- tests for that slice
- manual verification for that slice

Do not start the next feature until the current slice is stable.

### Step 5: Validate before commit

Default validation:

```bash
npm run typecheck
npm run test
npm run lint
npm run build
```

If packaging is required:

- produce one test build only
- remove or ignore old release folders
- give one absolute `.exe` path for testing

### Step 6: Commit

Commit after the round is stable.

Commit message rules:

- `feat: add convert mode export flow`
- `fix: prevent app crash after export`
- `refactor: isolate sharp work in child process`
- `docs: add git and agent workflow`

### Step 7: Merge back to main

```bash
git switch main
git merge --no-ff <branch-name>
git push
```

## 5. Tagging Rules

Tag stable milestones only.

Examples:

```bash
git tag v0.1.0
git push origin v0.1.0
```

Use tags for:

- first runnable build
- first stable MVP
- major behavior changes
- pre-release checkpoints

## 6. Rollback Rules

### Roll back one bad commit safely

```bash
git revert <commit-sha>
```

Use `revert` when the bad commit is already pushed.

### Inspect an older version

```bash
git checkout <commit-sha>
```

Do not develop from detached HEAD unless intentionally investigating.

### Return to latest main

```bash
git switch main
```

## 7. Agent Collaboration Rules

The user should choose one of these modes for each round.

### Mode A: Planning only

Use when the idea is still vague.

Template:

```text
我现在想做一个 xxx。
先不要写代码。
先帮我拆成：
1. V1 做什么
2. 这轮只做什么
3. 哪些以后再做
4. 一个合理的开发顺序
```

### Mode B: Implement one feature

Use when the goal is clear.

Template:

```text
本轮只做：
1. ...
2. ...

不要改：
1. UI 风格
2. 其他功能
3. 打包方式

完成标准：
1. ...
2. ...
3. ...

做完后给我：
1. 测试步骤
2. 唯一的可执行文件路径
3. 你改了什么
```

### Mode C: Fix one bug

Use when something is broken.

Template:

```text
现在有一个问题：
...

要求：
1. 先定位根因
2. 不要重构
3. 不要改 UI
4. 修完给我唯一测试路径
```

## 8. Scope Control Rules

The agent must not expand scope unless the user explicitly approves it.

Default rule:

- fix only the requested issue
- do not “顺手优化” unrelated parts
- do not redesign the whole UI during a bug fix round
- do not rewrite architecture during a feature delivery round

If the agent believes more changes are required, it should:

- say what the blocker is
- explain why it blocks the requested goal
- ask for approval implicitly by proposing the next scoped round

## 9. Packaging Rules

- Packaging is the last step of a round, not the first
- Do not package while core behavior is still unstable
- Keep one active release directory for user testing
- Ignore generated release folders in Git
- Always provide absolute Windows paths when handing off test builds

## 10. Definition of Done

A round is done only when all are true:

- the scoped goal is implemented
- excluded items were not changed without approval
- tests and build pass, or failures are explicitly explained
- the branch has a meaningful commit
- the user gets a clear test checklist
- if applicable, the user gets one testable build path

## 11. Recommended Next-Round Routine

Use this exact sequence:

1. `git switch main`
2. `git pull`
3. `git switch -c feat/<or-fix-name>`
4. define round scope in plain Chinese
5. implement one slice
6. validate
7. commit
8. test
9. merge to `main`
10. tag if milestone

## 12. Short Command Reference

```bash
git switch main
git pull
git switch -c feat/<name>
git status
git add .
git commit -m "feat: ..."
git switch main
git merge --no-ff feat/<name>
git push
git tag v0.1.0
git push origin v0.1.0
```
