# TASKS.md

## Milestone 0 — Project scaffolding ✅
- Initialize Electron + Next.js + React + TypeScript project structure.
- Add Tailwind CSS setup in renderer.
- Configure linting, typecheck, and basic test runner.
- Add build/dev scripts.

## Milestone 1 — Electron shell and security baseline ✅
- Implement `electron/main.cjs` window bootstrap.
- Implement `electron/preload.cjs` with minimal typed API.
- Enforce Electron security defaults (`contextIsolation`, `nodeIntegration: false`).
- Define strict IPC channel naming conventions.

## Milestone 2 — Core domain service layer ✅
- Create `src/main/services/imageService.ts`.
- Add request validation and standardized error objects.
- Add unit tests for non-trivial validation logic.
- Sharp transformation baseline integrated (resize/crop/format/quality).

## Milestone 3 — IPC contracts ✅
- Add health and batch-process IPC channels.
- Validate renderer payload shape in main process handlers.
- Return typed result envelopes (success/error per file).
- IPC baseline contract wired and ready for renderer integration.

## Milestone 4 — Renderer MVP UI ✅
- Build upload/queue UI.
- Build preview/result and transform controls.
- Build output destination picker.
- Build progress and error summary UI.

## Milestone 5 — Export and packaging ✅
- Implement ZIP export flow for processed outputs.
- Package desktop app for Windows EXE target.

## Milestone 6 — Hardening (next)
- Improve performance for medium batches.
- Improve error messaging and recovery UX.
- Add broader test coverage (IPC + E2E).
- Final MVP QA pass and release checklist.

## Verification & rollback workflow
1. Implement one milestone step at a time.
2. Run lint/test before each commit.
3. Commit each step independently for safe rollback.
4. Roll back by reverting only the latest milestone commit if needed.
