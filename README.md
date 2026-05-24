# Lady Bug

An interactive simulation scaffold built with [SceneryStack](https://scenerystack.org/).

This project is set up as a starting point to get familiar with the SceneryStack toolchain:

- **Vite** for the dev server and bundling
- **Biome** for linting and formatting
- **TypeScript** (strict)
- **Progressive Web App** (installable, offline-capable) via `vite-plugin-pwa`
- **GitHub Actions** for linting, building, and deploying to GitHub Pages

It contains a single empty screen (no simulation logic yet), wired up with color profiles
(default / projector) and internationalization (English / French).

## Prerequisites

- Node.js >= 20.19

## Setup

```bash
npm install
npm run icons   # generate PWA icons + favicon from public/icons/icon.svg
```

## Scripts

| Command           | Description                                          |
| ----------------- | ---------------------------------------------------- |
| `npm start`       | Start the Vite dev server                            |
| `npm run build`   | Type-check and build to `dist/`                      |
| `npm run preview` | Preview the production build                         |
| `npm run lint`    | Lint + format check with Biome                       |
| `npm run format`  | Auto-format with Biome                               |
| `npm run fix`     | Auto-fix lint issues and format with Biome           |
| `npm run check`   | Type-check `src/` and `scripts/`                     |
| `npm run icons`   | Regenerate icons from `public/icons/icon.svg`        |

## Project structure

```
src/
├── main.ts            Entry point (launches the Sim)
├── brand.ts           SceneryStack bootstrap chain: init -> assert -> splash -> brand
├── splash.ts
├── assert.ts
├── init.ts
├── LadyBugNamespace.ts
├── LadyBugColors.ts   Color profiles (default / projector)
├── i18n/              StringManager + per-locale JSON (en / fr)
└── lady-bug/          The (currently empty) Lady Bug screen
    ├── LadyBugScreen.ts
    ├── model/LadyBugModel.ts
    └── view/LadyBugScreenView.ts
```

## Deployment

Pushing to `main` builds the app and deploys it to GitHub Pages
(see `.github/workflows/deploy.yml`). Enable Pages with the "GitHub Actions" source
in the repository settings.

## License

[MIT](./LICENSE)
