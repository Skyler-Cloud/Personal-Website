# Personal website — first implementation

A personal portfolio and publishing site based on the editable Figma design. The public site is static; no database, server, or credentials are required. All sample articles, ratings, artwork and profile details are placeholders. The initial public deployment is a demonstration, not the finished personal portfolio.

## Run locally

Requires Node.js 22.12 or newer. From the repository root:

```sh
npm ci
npm run check
npm test
npm run dev
```

Open the URL printed by Astro. `npm run build` generates the production site in `apps/web/dist/`. `npm run preview` serves that build. The committed `package-lock.json` pins dependencies. Use `npm ci` for reproducible builds; use `npm install` only when intentionally changing dependencies.

Production uses locally bundled Play (bold) and Nunito, Markdown-It, and KaTeX. Native CJK/system fallback fonts support Chinese. The included standalone HTML preview is a different, offline-friendly test path: fonts use a Google Fonts stylesheet if reachable and math is not typeset with KaTeX in that preview. It is not the deployable Astro build.

## Content workflow

- `content/site.json`: name, introduction, email, portrait and homepage display limits.
- `content/writing/`: one Markdown file per article. The filename is a stable URL slug. JSON frontmatter (also valid YAML) is used in the examples; the production build accepts YAML as well.
- `content/gallery/`: one JSON record per artwork/photo, with image, alt text, title, medium and date. Put image files under `apps/web/public/assets/`. Actual artwork is displayed uncropped on its detail page.
- `content/properties.json`: writing categories and typed custom-property definitions.
- `content/views.json`: visible fields, order and empty-field rules for the homepage, writing list, article and category-specific views. Title is always displayed. Change these independently of the content.
- `design/tokens.json`: colors for light/dark themes and fonts. When selecting different font families, update the font imports in `apps/web/src/pages/[...path].astro` as well. Dark mode is an initial interpretation, not an approved Figma design.

Example `content/writing/my-review.md`:

```markdown
---
{
  "title": "My review",
  "date": "2026-11-27",
  "type": "review",
  "rating": 4.5,
  "summary": "Optional summary",
  "tags": ["Fanfiction"]
}
---

Write here. Omit any optional properties you don't want to fill in.
```

Types are `notes`, `technical`, `personal`, `review`. Add `"draft": true` to exclude a post from the public build. Draft files are still visible to anyone who can access the source repository, so keep private drafts outside a public repository. Rating zero is a real value, not an empty field. The initial scale is 0–5; change `min`, `max`, and `suffix` in the property definition if desired.

For an example custom field, add `{"id":"author","label":"Author","type":"text","categories":["review"]}` to the `fields` array, add `"author":"..."` to review frontmatter, and add `"author"` to the desired view's `fields` array. No renderer changes are needed for these supported field types. URL fields accept only HTTP(S).

## Architecture

```
content/               Portable content and property/view configuration
packages/contracts/    Types and repository interface (no UI or storage dependency)
packages/core/         Validation, sorting, reading time and property projection
packages/storage/      File repository implementing the content interface
packages/frontend/     Replaceable HTML renderer and design-token adapter
apps/web/              Astro static page shell, styles, client interactions and media
design/                Theme tokens
tests/                 Framework-independent automated tests
```

The frontend obtains a validated content snapshot via `Repository.load()`. It does not inspect filenames or parse frontmatter. Storage depends on contracts/core, not frontend. The frontend has a small Markdown-rendering adapter supplied by its host. The initial presentation renderer returns HTML strings so the static preview and Astro use the same code; future redesigns may replace it with native Astro/Svelte components without rewriting content or core. HTML escaping is centralized; Markdown disables raw HTML. The current design is a static build-time interface, not a network API. If a private editor needs a server later, it can implement a separate authenticated write API.

## Hosting and development

The site uses GitHub Pages and GitHub Actions, with no separate hosting service. Production URL: https://skyler-cloud.github.io/Personal-Website/.

The workflow checks TypeScript, runs unit tests, builds and checks the root site, then builds and checks the actual Pages subdirectory. Only successful builds on the main branch (not pull requests) may deploy. Pull requests can be used to test experimental changes without replacing the public site; a separate live preview deployment for each branch is not configured yet.

The Astro project lives in apps/web; its build output is apps/web/dist. On main the workflow gets the origin and base path from GitHub Pages. For a local simulation of the hosted path, set BASE_PATH=/Personal-Website/ and SITE_URL=https://skyler-cloud.github.io when running npm run build, and the same BASE_PATH when running npm run check:build.

The repository is public. Draft exclusion applies to the generated site, not the source repository or commit history. Never commit private drafts, secrets, or confidential research. No broad reuse license has been granted.

## Verification and limitations

- The initial GitHub verification runs passed type checking, unit tests, production builds and local link/asset checks at the root and a test subdirectory. The committed lockfile was recovered from the first successful run.
- The offline HTML preview can be rebuilt with node --experimental-strip-types scripts/build-preview.mjs after installing Python 3 and mistune. This is not the production build.
- The current art and portrait are illustrative placeholder SVGs, not exported Figma artwork. Dark mode is an initial interpretation rather than an approved Figma design.
- The private visual Content Studio, standalone interactive artwork, Figma-to-CSS synchronization, full accessibility audit, Safari validation, image optimization pipeline, search, RSS, sitemap and separate live branch previews are not implemented yet.
