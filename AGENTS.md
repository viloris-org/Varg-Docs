# Repository Guidelines

## Project Structure & Module Organization

This is an Astro + Starlight documentation site for Varg. Source files live under `src/`: pages are in `src/pages/`, global styling is in `src/styles/custom.css`, content configuration is in `src/content.config.ts`, and localized docs are under `src/content/docs/{zh,en,ja,es,de}/`. Keep each locale's section structure aligned, for example `scripting/basics.md` should exist consistently across translated locales when content is added. Static public assets belong in `public/`; source-managed assets can live in `src/assets/`. `dist/` is generated build output.

## Build, Test, and Development Commands

- `npm install` installs dependencies from `package-lock.json`.
- `npm run dev` or `npm start` starts the Astro dev server on `0.0.0.0`.
- `npm run build` runs the production Astro build and should be used as the primary validation step.
- `npm run preview` serves the built site locally for final inspection.

There is no dedicated test script in this repository; treat a clean `npm run build` as the required check before submitting changes.

## Coding Style & Naming Conventions

Use ESM JavaScript/TypeScript style, matching existing files: two-space indentation, single quotes, and semicolons in config files. Name documentation files with lowercase kebab-case, such as `first-playable-loop.md`. Preserve Starlight frontmatter conventions and keep sidebar slugs in `astro.config.mjs` synchronized with content paths. Keep custom CSS in `src/styles/custom.css` rather than inline styles.

## Testing Guidelines

For documentation changes, verify the affected locale pages in the dev server and run `npm run build` to catch broken routes, invalid frontmatter, and Starlight content errors. When adding a page in one locale, check whether matching pages, sidebar labels, and translations are needed in the other locale directories.

## Commit & Pull Request Guidelines

Git history uses short, imperative commit subjects such as `Add multilingual docs` and `Serve hero image statically`. Follow that style: one concise subject, capitalized, no trailing period. Pull requests should describe the user-visible docs change, list affected locales or routes, link related issues when available, and include screenshots for visual or navigation changes.

## Licensing Notes

Site code is MIT licensed. Documentation content under `src/content/docs/` is CC BY 4.0, so keep imported or translated material attribution-compatible.
