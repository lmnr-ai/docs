# Laminar Docs: Agent Notes

This is a Mintlify site. Pages are `.mdx`, navigation lives in `docs.json`, reusable fragments in `/snippets`, images in `/images`. The `docs-writing` skill contains the canonical voice, SEO, and template guidance. Read it before making non-trivial edits.

## Navigation and linking

- Every new page MUST be added to `docs.json`. Pages not listed there are unreachable from the sidebar even if they exist on disk.
- When deleting or moving a page, also `grep -r "tracing/integrations/<slug>"` across the repo to find inbound links. Common offenders: sibling integration pages often cross-link via a `<Note>` block and those must be updated in lockstep.
- Internal links use absolute paths from the docs root with no `.mdx` extension: `[Signals](/signals)`.

## Vercel AI SDK integration (v0.8.x SDK)

- AI SDK telemetry is opt-in per call via `experimental_telemetry: { isEnabled: true, tracer: getTracer() }`. Forgetting to pass the tracer is the single most common "no traces" failure.
- Next.js: Laminar must go in `instrumentation.ts` with a `NEXT_RUNTIME === 'nodejs'` guard, and `@lmnr-ai/lmnr` must be in `serverExternalPackages` in `next.config.ts`. OpenTelemetry uses Node-specific APIs Next.js cannot bundle.
- Coexistence with `@vercel/otel`: do NOT call `Laminar.initialize()` (that registers a second provider). Pass `new LaminarSpanProcessor()` into `registerOTel({ spanProcessors: [...] })` instead.
- Direct SDK clients (OpenAI, Anthropic) imported outside `instrumentation.ts` are not auto-instrumented in Next.js. Call `Laminar.patch({ OpenAI, anthropic })` where the client is constructed.
- AI SDK is TypeScript-only; there is no Python AI SDK integration page to write.

## Prod-mode screenshots

- Use the `running-lmnr-stack-prod` skill (not dev mode). Dev overlays and the dev indicator look unprofessional in published screenshots.
- Viewport: **1512 x 982** (MBP 14" equivalent) per `docs-writing`. The `agent-browser` README says 1280x720, but `docs-writing` wins for docs work.
- Staging DB schema drift has blocked screenshot capture before: the traces list and trace detail page can 404 or show "Trace not found" if Postgres/ClickHouse migrations in the staging DBs lag behind the app-server code. When this happens, reuse an existing real screenshot from `/images/` and note the limitation in the PR body rather than substituting a dev-mode shot.
- Never `ALTER` staging schemas to work around drift. The sandbox constraint is explicit: "NEVER alter schemas unless explicitly requested." Revert any exploratory changes before committing.
- "Schema drift" in the sandbox is usually tracking-table drift, not real DDL drift. The real DDL from `lib/db/migrations/*.sql` is typically already applied; what's inconsistent is the `drizzle.__drizzle_migrations` table (dummy hashes, stale rows). Reconciling that table with the sha256 of each migration file's contents (matching `_journal.json` order) lets the frontend boot with `FORCE_RUN_MIGRATIONS=true` without touching schema. `clickhouse-migrations` tracking lives in `default._migrations` and is usually also already consistent.
- Shell env `LMNR_PROJECT_API_KEY` is set to a background-agent key (not the sandbox e2e key). `.env` loading does NOT override pre-existing process env. When running local demos that ingest to the sandbox app-server, pass the key literal explicitly to `Laminar.initialize({ projectApiKey: 'lmnr_e2e_test_key_abc123xyz', ... })` instead of `process.env.LMNR_PROJECT_API_KEY`, or the SDK will send the wrong bearer and app-server will 401. Symptom in `/tmp/as.log`: `Error validating project_token: invalid project API key`.

## Voice gotchas not caught by linters

- `grep "[em-dash]" <file>` before committing (em dashes are banned by `docs-writing` and easy to sneak in from copy-paste).
- `grep -E "seamless|powerful|unleash|cutting-edge|best-in-class|revolutionary|supercharge"` returns banned marketing words.
- Every integration page needs the three forward links in data-flow order: viewing traces, then Signals, then SQL access (editor/API/MCP).

## Formatting

- Run `prettier --write` ONLY on the specific files you changed. Never `pnpm format:write` or `prettier --write .`; it touches unrelated files. Note that the docs repo itself has no `package.json` or prettier config, so prettier is not part of the workflow here.
