# Image-Shift Agent Rules

## Project goal
Build a local desktop app for image resizing, compression, cropping, format conversion, and batch export.

## Product scope
MVP only includes:
- image upload
- image preview
- resize
- compress
- crop
- format conversion
- batch processing
- zip export

Not in MVP:
- OCR
- background removal
- authentication
- cloud storage
- AI editing
- collaboration

## Required stack
- Electron
- Vite
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Sharp

## Architecture rules
- Keep strict separation between Electron `main`, `preload`, and `renderer`.
- Keep all image processing logic in `src/main/services/imageService.ts`.
- Use preload as the only bridge between renderer and main.
- Validate all IPC inputs in main process.
- Do not expose Node.js primitives directly to renderer.

## Coding rules
- Use strict TypeScript.
- Keep components modular.
- Separate UI, IPC contracts, and processing logic.
- Validate all user inputs.
- Add helpful error messages.
- Prefer simple and maintainable solutions.
- Do not introduce unnecessary dependencies.

## Workflow rules
- Do not make large uncontrolled changes.
- Before coding, explain the plan.
- After coding, summarize:
  - files changed
  - what was implemented
  - how to test
  - known limitations
- Keep each task scoped and reviewable.
- If something is ambiguous, choose the simplest MVP-friendly approach.

## Quality rules
- Run lint.
- Run typecheck.
- Add tests when logic is non-trivial.
- Do not leave dead code.
- Do not silently change unrelated files.

## Privacy and data rules
- Local-first only: never upload user images to remote services.
- Prefer offline-capable behavior for all MVP workflows.
