# TASKS.md

## Milestone 0 — Project scaffolding
- Initialize Electron + Vite + React + TypeScript project structure.
- Add Tailwind CSS and shadcn/ui setup in renderer.
- Configure linting, typecheck, and basic test runner.
- Add build/dev/package scripts.

## Milestone 1 — Electron shell and security baseline
- Implement `src/main/main.ts` window bootstrap.
- Implement `src/preload/index.ts` with minimal typed API.
- Enforce Electron security defaults (`contextIsolation`, `nodeIntegration: false`, sandbox where compatible).
- Define strict IPC channel naming conventions.

## Milestone 2 — Core domain service layer
- Create `src/main/services/imageService.ts`.
- Add Sharp-based functions for resize, compress, crop, and format conversion.
- Add input validation and standardized error objects.
- Add unit tests for non-trivial transformation logic.

## Milestone 3 — IPC contracts
- Implement `src/main/ipc/imageIpc.ts` handlers for processing requests.
- Validate renderer payloads in main before invoking services.
- Return typed result envelopes (success/error per file).

## Milestone 4 — Renderer MVP UI
- Build upload/queue UI with shadcn/ui components.
- Build preview panel and transform controls.
- Build batch settings panel and output destination picker.
- Build progress and error summary UI.

## Milestone 5 — Export and packaging
- Implement ZIP export flow for processed outputs.
- Add basic smoke tests for end-to-end MVP flow.
- Package desktop app for target platforms.

## Milestone 6 — Hardening
- Improve performance for medium batches.
- Improve error messaging and recovery UX.
- Final MVP QA pass and release checklist.
