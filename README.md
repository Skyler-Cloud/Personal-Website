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

- `content/site.json`: shared name and display limits, Personal bio/portrait/contact, independent Academic bio/portrait/contact, education, publications, and default category assignments.
- `content/writing/`: one Markdown file per article. The filename is a stable URL slug. JSON frontmatter (also valid YAML) is used in the examples; the production build accepts YAML as well.
- `content/gallery/`: one JSON record per artwork/photo, with image, alt text, title, medium and date. Put image files under `apps/web/public/assets/`. Actual artwork is displayed uncropped on its detail page.
- `content/properties.json`: writing categories and typed custom-property definitions.
- `content/views.json`: visible fields, order and empty-field rules for the homepage, writing list, article and category-specific views. Title is always displayed. Change these independently of the content.
- `design/tokens.json`: colors and typography for Academic/Personal modes. When selecting different font families, update the font imports in `apps/web/src/pages/[...path].astro` as well. Academic typography currently uses system Georgia bold italic as a provisional font; Personal retains Play and Nunito.

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

## Academic / Personal modes

The root displays Academic; `/academic/` and `/personal/` are stable links. Each has a writing index and article routes. Academic adds papers and education; Personal retains the gallery. Earlier `/writing/`, `/writing/<slug>/` and `/gallery/` URLs still work, with scoped canonical URLs. The mode switch uses ordinary links (no JavaScript or stored preference required). On writing pages it keeps the corresponding writing section or article where available.

By default, notes appear in both modes, technical writing in Academic, personal posts and reviews in Personal. Set frontmatter `"modes": ["academic"]` or `["personal"]` or both to override. Categories and display properties are still independently configurable. Put the second portrait in `apps/web/public/assets/` and set `academic.portrait` separately. Academic contact links are rendered only when configured; CV can be an HTTP(S) URL or an `assets/...` file. Education is an array of institution/degree/dates objects, papers an array of id/title/authors/venue/year/summary/pdf/code/url/bibtex objects, with only institution or id/title required. Unconfigured links are omitted.

## Navigation performance

Astro's ClientRouter provides client-side navigation without a backend, with normal links as fallback. Major navigation links prefetch when visible; article/gallery links use hover/touch intent. The router swaps the page's HTML attributes (including the mode), and a single delegated filter listener remains active across navigation. Animations are disabled to minimize visual delay. KaTeX CSS is linked only when rendered math exists; its pinned stylesheet and fonts are copied locally by the prebuild/predev script. The standalone HTML preview is not a test of Astro navigation.

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

The workflow checks TypeScript, runs unit tests, builds and checks the root site, then builds and checks the actual Pages subdirectory. Only successful builds on the main branch (not pull requests) may deploy. Pull requests can be used to test experimental changes without replacing the public site; one explicitly selected development branch is hosted under /preview/.

The Astro project lives in apps/web; its build output is apps/web/dist. On main the workflow gets the origin and base path from GitHub Pages. For a local simulation of the hosted path, set BASE_PATH=/Personal-Website/ and SITE_URL=https://skyler-cloud.github.io when running npm run build, and the same BASE_PATH when running npm run check:build.

The repository is public. Draft exclusion applies to the generated site, not the source repository or commit history. Never commit private drafts, secrets, or confidential research. No broad reuse license has been granted.

## Verification and limitations

- The initial GitHub verification runs passed type checking, unit tests, production builds and local link/asset checks at the root and a test subdirectory. The committed lockfile was recovered from the first successful run.
- The offline HTML preview can be rebuilt with node --experimental-strip-types scripts/build-preview.mjs after installing Python 3 and mistune. This is not the production build.
- The current art and portrait are illustrative placeholder SVGs, not exported Figma artwork. Academic typography is provisional; the actual photos, CV, education, and publications are not populated.
- The private visual Content Studio, standalone interactive artwork, Figma-to-CSS synchronization, full accessibility audit, Safari validation, image optimization pipeline, search, RSS, sitemap and separate per-PR preview URLs are not implemented yet.

## Hosted development preview

The public site has one reserved development path: https://skyler-cloud.github.io/Personal-Website/preview/. The `preview` branch selects the code to review. Push only trusted, owner-approved development commits there; fork pull requests are not automatically published. Updating that branch triggers a refresh of the single Pages deployment. Production is always built from main, and preview is built in a separate read-only job using the /preview/ base path. A manual run of **Verify and deploy website** on main also refreshes both. Preview content is public, with noindex metadata (not access control). If the preview build fails, production may still deploy without the preview directory. The reserved preview path must not be used for production content. For independent feature review, keep a feature PR open, update the preview branch to its reviewed head, and merge only after approval. No separate hosting account is required.

## Root-domain migration

The deployment workflow derives the base path from GitHub Pages configuration or the repository name. Renaming the repository to `skyler-cloud.github.io` switches the public base to `/`, with the existing Academic homepage as the root and Personal at `/personal/`. The hosted development preview moves to `/preview/`. After renaming, confirm GitHub Actions is the Pages source and manually run Verify and deploy website on main if needed. Existing project-site URLs are not automatically redirected by GitHub Pages.
