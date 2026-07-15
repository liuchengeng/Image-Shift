# Image-Shift

Image-Shift is a local-first Windows desktop app for image conversion, compression, background removal, cropping, resizing, and reference-based layout matching.

## Match Layout

1. Open **Match Layout** and choose a reference image.
2. Import target images; their canvas dimensions may differ from the reference.
3. Review the Reference/Matched preview and optionally adjust scale or X/Y position for each target.
4. Choose an output folder and export the batch.

The reference stays outside the export queue. Its subject bounds are projected proportionally onto each target canvas, while processing remains local, preserves each target canvas and file format, and stores manual adjustments separately for every queued image.

## Stack

- Electron
- Next.js
- React
- TypeScript
- Sharp

## Development

```bash
npm install
npm run desktop:dev
```

## Validation

```bash
npm run typecheck
npm run test
npm run lint
npm run build
```

## Windows Build

```bash
npm run desktop:build:win
```

The Windows installer is written to `release/`. Install it once for fast subsequent launches. A slower single-file self-extracting build remains available through `npm run desktop:build:portable`.

For a no-install green build, zip the complete `release/win-unpacked` folder and extract it once before running `Image-Shift.exe`; the executable cannot be copied out of that folder by itself.

The repository ignores local build outputs such as `release-*`, `.next`, `out`, and `node_modules`.
