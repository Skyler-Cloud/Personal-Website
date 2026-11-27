# Personal website — first implementation

A personal portfolio and publishing site based on the editable Figma design. The public site is static; no database, server, or credentials are required. All sample articles, ratings, artwork and profile details are placeholders. Replace them before publishing.

## Run locally

Requires Node.js 22.12 or newer. From the repository root:

```sh
npm install
npm run check
npm test
npm run dev
```

Open the URL printed by Astro. `npm run build` generates the production site in `apps/web/dist/`. `npm run preview` serves that build. Commit the generated `package-lock.json` after the initial successful install, then use `npm ci` for subsequent reproducible builds.

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

## Deployment (not performed yet)

Create a GitHub repository, push this source tree, and choose a static hosting service. The included GitHub Actions workflow builds and checks the project but deliberately does not publish it automatically. For Cloudflare Pages, set the build command to `npm run build` and output directory to `apps/web/dist`. For GitHub Pages project hosting, build with `BASE_PATH=/your-repository/` and configure Pages to publish the generated artifact. For a custom domain, use `BASE_PATH=/` and set `SITE_URL` to the public origin.

## Verification and current limitations

- Core automated tests cover draft exclusion, optional fields, zero ratings, custom field configuration, validation, and generated routes.
- Offline HTML preview can be rebuilt with `node --experimental-strip-types scripts/build-preview.mjs` after installing Python 3 and `mistune`.
- The Figma Education plan is confirmed. Latest design context was retrieved for mobile home, desktop home, gallery, writing, review and article. Asset downloads were blocked by DNS; the existing illustrative placeholder SVGs are retained, not exact exported Figma assets. Production dependencies could not be installed in the authoring environment, so the Astro build and TypeScript check must be verified after `npm install`. No lockfile is supplied yet.
- The private visual Content Studio, Figma-to-CSS synchronization, full accessibility audit, Safari validation, image optimization pipeline, search, RSS and sitemap are not implemented in this first version. Configurable views work through JSON files. Static preview is for exploration, not production hosting.

## Verification and free preview hosting (v0.1.1)

The verification workflow runs on pushes, pull requests, and manual dispatch. It checks types, runs fixture-based unit tests (adding real content does not invalidate sample counts), builds Astro, and checks generated routes, draft exclusion, local links/assets and KaTeX rendering. It also repeats the build for a non-root hosting path. On the first run, download `dependency-lockfile` from the workflow artifacts and commit `package-lock.json`; later runs use `npm ci`. The CI build has not yet been executed because this environment cannot access npm. The actual result must be checked in GitHub Actions.

Recommended preview hosting: create a **private** GitHub repository called `personal-website`, push the contents of this folder (including `.github`), and connect it to Cloudflare Pages using Git integration. Use production branch `main`, root directory the repository root, build command `npm run build`, output directory `apps/web/dist`, and environment variable `NODE_VERSION=22` (or a current 22.x version). Keep `BASE_PATH=/` (default). The Pages free tier provides a `pages.dev` address and branch previews. Preview URLs are publicly reachable unless access controls are configured; do not publish private information or confidential research. GitHub private Actions runs use the account's included minutes/storage; set a zero spending limit or avoid enabling paid overages. GitHub Pages is an alternative for a public repository, but is not configured here. No custom domain purchase is necessary.

Local verification performed in this revision: 9 unit tests passed and the independent TypeScript packages/tests passed using the environment's installed TypeScript and Node types. Astro dependency installation, production output, exact fonts and KaTeX in the site itself remain to be verified on GitHub.
