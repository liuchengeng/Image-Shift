# Image-Shift

Image-Shift is a local-first Windows desktop app for image conversion, compression, cropping, and resizing.

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
npm run desktop:build:dir
```

The repository ignores local build outputs such as `release-*`, `.next`, `out`, and `node_modules`.
