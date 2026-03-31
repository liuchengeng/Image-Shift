# Image-Shift

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
