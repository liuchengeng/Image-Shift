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
