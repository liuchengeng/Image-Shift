# PRODUCT_SPEC.md

## Product name
Image-Shift

## Vision
Provide a fast, privacy-preserving desktop utility for common image transformations and batch export workflows.

## Product type
Local desktop application (Electron-based), local-first with no remote uploads.

## MVP goals
1. Enable users to import images from local storage.
2. Let users preview selected images before processing.
3. Support core transformations (resize, compress, crop, format conversion).
4. Support batch processing with consistent output settings.
5. Export processed images as files and optionally as a ZIP archive.

## MVP feature requirements
### 1) Image upload
- Users can select one or multiple local image files.
- Supported input types (initial): PNG, JPEG, WebP.
- Invalid files should be rejected with clear errors.

### 2) Image preview
- Show preview thumbnail and key metadata (filename, dimensions, size).
- Preview reflects selected transformation settings before export (where feasible).

### 3) Resize
- Resize by width/height with aspect ratio lock option.
- Optional fit modes for crop/contain behavior.

### 4) Compress
- Adjustable quality level by format.
- Show estimated output size (best effort).

### 5) Crop
- Interactive crop box in renderer UI.
- Crop parameters validated in main process before execution.

### 6) Format conversion
- Convert between PNG, JPEG, and WebP in MVP.
- Expose format-specific options only when relevant.

### 7) Batch processing
- Apply one settings profile to selected images.
- Report per-file success/failure.

### 8) ZIP export
- Export all processed files to one ZIP archive.
- Allow target folder selection on local disk.

## Non-goals (out of MVP)
- OCR
- Background removal
- Authentication
- Cloud storage / remote sync
- AI-powered editing
- Real-time collaboration

## Functional constraints
- All processing runs locally on the user machine.
- No server/backend required for MVP.
- No telemetry required in MVP.

## Technical constraints
- Use Electron + Vite + React + TypeScript.
- Use Tailwind CSS + shadcn/ui for renderer UI.
- Use Sharp in main process services for image transformations.
- Image processing logic must live in `src/main/services/imageService.ts`.

## Success criteria for MVP
- User can process a batch of local images using supported operations.
- Output files are written to user-selected local path.
- App remains responsive for moderate-size batches.
- Error handling provides actionable feedback.
