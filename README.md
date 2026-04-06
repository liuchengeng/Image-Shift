# Image-Shift

Image-Shift is a local-first desktop app for resizing, compressing, cropping, format conversion, batch processing, and ZIP export.

## MVP status
- ✅ Local file selection
- ✅ Resize / compress / format conversion
- ✅ Batch processing
- ✅ Output folder selection
- ✅ ZIP export
- ✅ Windows EXE build path (`electron-builder`)

## Run (desktop dev)
```bash
npm install
npm run desktop:dev
```

## Build Windows EXE
```bash
npm run desktop:build:win
```
Expected output:
- installer `.exe` under `release/`

## Step-by-step verification
1. Launch desktop app:
```bash
npm run desktop:dev
```
2. Click **Pick Images** and select multiple local images.
3. Click **Pick Output Folder**.
4. Set format/quality/size and click **Process Batch**.
5. Confirm success/failure results in UI.
6. Enter zip filename and click **Export ZIP**.
7. Verify output images + zip archive in output directory.

## Rollback strategy
- One milestone step = one commit.
- Revert by commit if a step fails verification.
- Keep main/preload/renderer changes scoped for safe rollback.

## Key structure
```text
app/                    # Renderer UI
src/main/services/      # Image processing service (Sharp)
src/main/ipc/           # IPC contracts
src/shared/types/       # Shared request/response types
electron/main.cjs       # Electron main + IPC handlers
electron/preload.cjs    # Preload bridge API
```
Image-Shift is a local-first desktop app for resizing, compressing, cropping, format conversion, and batch export of images.

## MVP scope
Included:
- Image upload from local files
- Image preview
- Resize
- Compress
- Crop
- Format conversion
- Batch processing
- ZIP export

Excluded from MVP:
- OCR
- Background removal
- Authentication
- Cloud storage
- AI editing
- Collaboration

## Core principles
- Local-first: no remote upload, no cloud dependency
- Privacy-focused: image files remain on the user's machine
- Maintainable architecture: clear separation of Electron main, preload, and renderer layers

## Tech stack
- Electron
- Vite
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Sharp

## Getting started

### Prerequisites
- Node.js 20+
- npm 10+
- A desktop OS supported by Electron (macOS, Windows, Linux)

### Install
```bash
npm install
```

### Development
```bash
npm run dev
```
Expected behavior:
- Starts Vite renderer dev server
- Launches Electron app pointed to the renderer

### Build
```bash
npm run build
```
Expected behavior:
- Builds renderer and Electron main/preload bundles

### Package (planned)
```bash
npm run package
```
Expected behavior:
- Produces installable desktop artifacts per platform

## Suggested scripts
These are expected scripts for the project scaffold:
- `dev`: run Vite + Electron in development
- `build`: production build for all app layers
- `lint`: run linter
- `typecheck`: run TypeScript checks
- `test`: run unit tests
- `package`: package distributable desktop app

## Project structure (target)
```text
src/
  main/
    main.ts
    ipc/
      imageIpc.ts
    services/
      imageService.ts
  preload/
    index.ts
  renderer/
    main.tsx
    App.tsx
    components/
    features/
    styles/
```

## Security notes
- `contextIsolation: true`
- `nodeIntegration: false`
- Preload exposes a minimal, typed API surface
- Renderer never gets unrestricted Node.js access

## Current status
Documentation setup is complete. Product features are intentionally not implemented yet.
