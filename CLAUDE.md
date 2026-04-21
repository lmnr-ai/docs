# Laminar Docs: Agent Notes

This is a Mintlify site. Pages are `.mdx`, navigation lives in `docs.json`, reusable fragments in `/snippets`, images in `/images`.

## Navigation and linking

- Every new page MUST be added to `docs.json`. Pages not listed there are unreachable from the sidebar even if they exist on disk.
- When deleting or moving a page, also `grep -r "tracing/integrations/<slug>"` across the repo to find inbound links. Common offenders: sibling integration pages often cross-link via a `<Note>` block and those must be updated in lockstep.
- Internal links use absolute paths from the docs root with no `.mdx` extension: `[Signals](/signals/introduction)`.
- Mintlify auto-redirects `/<group-slug>` to the first page in the group when you add a sidebar group whose slug matches an existing single-page URL (verified: `/signals` → 307 → `/signals/introduction` after converting `signals.mdx` into a `signals/` group). No explicit redirect entry is needed in `docs.json` when splitting a page into a group, but inbound links should still be updated to the canonical first-page URL.
- Run `npx mintlify broken-links` from `/repos/docs` after any restructuring that moves or renames pages; it catches intra-docs link regressions in seconds and is more reliable than grepping for old paths.

## Vercel AI SDK integration (v0.8.x SDK)

- AI SDK telemetry is opt-in per call via `experimental_telemetry: { isEnabled: true, tracer: getTracer() }`. Forgetting to pass the tracer is the single most common "no traces" failure.
- Next.js: Laminar must go in `instrumentation.ts` with a `NEXT_RUNTIME === 'nodejs'` guard, and `@lmnr-ai/lmnr` must be in `serverExternalPackages` in `next.config.ts`. OpenTelemetry uses Node-specific APIs Next.js cannot bundle.
- Coexistence with `@vercel/otel`: do NOT call `Laminar.initialize()` (that registers a second provider). Pass `new LaminarSpanProcessor()` into `registerOTel({ spanProcessors: [...] })` instead.
- Direct SDK clients (OpenAI, Anthropic) imported outside `instrumentation.ts` are not auto-instrumented in Next.js. Call `Laminar.patch({ OpenAI, anthropic })` where the client is constructed.
- AI SDK is TypeScript-only; there is no Python AI SDK integration page to write.

## Screenshots

- Capture from the production build of the frontend, not the dev server: dev overlays and the Next.js dev indicator look unprofessional in published shots.
- Viewport: **1512 x 982** (MBP 14" equivalent).
- Wrap screenshots in `<Frame caption="...">` and keep them in `/images/` organized by area (e.g. `/images/tutorials/`, `/images/platform/`).

## Voice gotchas not caught by linters

- `grep "[em-dash]" <file>` before committing. Em dashes should not appear in docs prose; they sneak in easily from copy-paste. `<Frame caption="...">` strings are a frequent source — prefer a colon over an em dash inside captions.
- `grep -E "seamless|powerful|unleash|cutting-edge|best-in-class|revolutionary|supercharge"` returns banned marketing words.
- Every integration page needs the three forward links in data-flow order: viewing traces, then Signals, then SQL access (editor/API/MCP).

## Formatting

- Run `prettier --write` ONLY on the specific files you changed. Never `pnpm format:write` or `prettier --write .`; it touches unrelated files. Note that the docs repo itself has no `package.json` or prettier config, so prettier is not part of the workflow here.
