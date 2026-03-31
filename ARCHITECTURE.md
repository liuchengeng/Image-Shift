# ARCHITECTURE.md

## Overview
Image-Shift is a local-first Electron desktop app with strict separation between:
- Main process (privileged runtime, file system + Sharp access)
- Preload layer (secure API bridge)
- Renderer process (React UI, unprivileged)

## High-level layering
1. **Renderer (`src/renderer`)**
   - Presents UI and captures user intents.
   - Does not access Node.js APIs directly.
   - Calls typed functions exposed via preload.

2. **Preload (`src/preload`)**
   - Uses `contextBridge` to expose minimal API surface.
   - Validates/sanitizes outgoing requests when needed.
   - Shields renderer from raw `ipcRenderer` primitives.

3. **Main (`src/main`)**
   - Owns app lifecycle, file dialogs, file I/O, and processing orchestration.
   - Registers IPC handlers and validates all inputs.
   - Delegates image transformations to `src/main/services/imageService.ts`.

## Image processing service boundary
- All image processing logic must live in:
  - `src/main/services/imageService.ts`
- Responsibilities:
  - Resize
  - Compress
  - Crop
  - Format conversion
  - Batch execution helpers

Renderer and preload must not implement transformation logic.

## IPC boundary design
### Renderer -> Preload
- Renderer calls typed preload methods, e.g.:
  - `imageApi.processBatch(request)`
  - `imageApi.pickInputFiles()`
  - `imageApi.pickOutputFolder()`

### Preload -> Main
- Preload forwards calls over allowlisted IPC channels only.
- Example channel patterns:
  - `image:pick-input`
  - `image:pick-output`
  - `image:process-batch`

### Main validation
- Main validates:
  - file path shape and existence
  - supported formats
  - numeric ranges (quality, width/height)
  - crop bounds
- Rejects invalid payloads with structured, user-friendly errors.

## Electron security model
Security defaults for BrowserWindow:
- `contextIsolation: true`
- `nodeIntegration: false`
- `enableRemoteModule: false`
- `sandbox: true` (enable if compatible with tooling)

Additional security guidance:
- Do not expose raw `ipcRenderer` or unrestricted eval-like APIs to renderer.
- Use explicit channel allowlists.
- Keep preload API minimal and versioned.
- Apply Content Security Policy for renderer assets.
- Never execute arbitrary shell commands from renderer-provided input.

## Data flow (MVP)
1. User selects local files in renderer.
2. Renderer asks preload to invoke main dialog APIs.
3. Main returns selected file paths.
4. Renderer sends processing request (settings + file list).
5. Main validates request and calls `imageService`.
6. Main writes outputs to selected local path.
7. Main optionally bundles outputs into ZIP.
8. Renderer shows per-file result summary.

## Error handling strategy
- Service layer returns typed success/error results.
- IPC handlers map internal failures to safe user-facing errors.
- Renderer displays clear per-file error details.

## Future extensions (post-MVP)
- Additional formats
- Preset profiles
- GPU acceleration experiments
- Non-destructive edit history
