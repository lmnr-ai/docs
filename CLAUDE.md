# Laminar Docs: Agent Notes

This is a Mintlify site. Pages are `.mdx`, navigation lives in `docs.json`, reusable fragments in `/snippets`, images in `/images`.

## Frontmatter

- Do NOT include a `description:` field in MDX frontmatter. It renders awkwardly in Mintlify and doesn't help SEO. Keep frontmatter to `title:` (and `sidebarTitle:` where needed).

## SEO

- The first ~150 words of a page matter disproportionately for search ranking and snippets. On integration and overview pages, lead paragraph one with what Laminar is plus the framework/SDK name (e.g. "Laminar is an open-source, OpenTelemetry-native observability platform for <X>. Trace, debug, and monitor ..."). Include the key product nouns (observability, OpenTelemetry, self-host/Helm, managed cloud) and action verbs (trace, debug, monitor).
- Defer "what the third-party SDK is" to paragraph two. The opening shouldn't burn SEO real estate on content that never names Laminar.

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
- For screenshots of a resulting trace, open the trace in **transcript view** and expand the first LLM span. Span-tree-only shots (and raw-JSON-only shots) understate what users actually get; the transcript is the default Laminar UX and should be what they see first.
- Exception: when the *point* of the screenshot is to show span nesting across processes (e.g. a caller-side `observe` wrapping a server-side turn span), capture the **tree view** alongside the transcript view. Use both in the same section so the hierarchy is obvious.
- Close the "Chat with trace" and Signals side panels before capturing so the trace plus transcript are the dominant content. Dismiss any "New: …" Mintlify-style feature popups too.
- For the **Reports** page: workspaces that predate the default-reports logic (created before LAM-1474) will have an empty reports table in staging. Seed two rows into `reports` (`type=SIGNAL_EVENTS_SUMMARY`, `weekdays={0,1,2,3,4}`/`{6}`, `hour=10`) + matching `report_targets` so the screenshot shows "Weekday/Weekly signals summary" rows instead of the empty state.
- For the **project Alerts** page: insert a `NEW_CLUSTER` alert alongside the existing `SIGNAL_EVENT` alerts in staging to visibly exercise the Trigger + Severity columns (severity is blank/"—" for `NEW_CLUSTER` rows, which is the expected rendering).

## Voice gotchas not caught by linters

- `grep "[em-dash]" <file>` before committing. Em dashes should not appear in docs prose; they sneak in easily from copy-paste. `<Frame caption="...">` strings are a frequent source — prefer a colon over an em dash inside captions.
- `grep -E "seamless|powerful|unleash|cutting-edge|best-in-class|revolutionary|supercharge"` returns banned marketing words.
- Every integration page needs the three forward links in data-flow order: viewing traces, then Signals, then SQL access (editor/API/MCP).

## Prose style Robert favors (observed from edits on `signals/introduction.mdx`)

- **Use italics for rhetorical hypotheticals**, not plain quotes. `*did it get stuck, did the user give up*` reads better than `"did it get stuck..."`.
- **Use bold for the thesis sentence and the call-to-action phrase**, and inline links inside the bold (`**[query](...), [cluster](...), and [alert](...) on**`). It lets the eye land on the payoff.
- **Lead with the image early**, not after several sections of exposition. First image should sit right after the opening pitch so scanners see the product.
- **Three-column `<CardGroup>` feels crowded**; default to `cols={2}` for next-step nav.
- **Drop fields that are self-evident** from surrounding context. When listing the parts of an object, don't enumerate every attribute — skip the ones a reader would assume exist (e.g. a Name on a Signal). Trim to the parts that are actually interesting to describe.
- **Conversational H2s**: prefer "Run a Signal on new traces or historical traces" over "Ways to run a Signal". Headers can be long if they answer a question directly.
- **Concrete speech, not abstract definitions**: "If you've written a Slack message that starts with 'can you look through today's runs...'" beats "Signals are for open-ended investigations".
- Keep one or two `<Note>` callouts per page for side information that would otherwise break flow (e.g. "these are queryable via `signal_events`"). Don't inline the detail into prose.

## Alerts and reports coupling

- Alerts are **project-level** (`/repos/lmnr/app-server` writes to `alerts` / `alert_targets`); reports are **workspace-level** (`reports` / `report_targets`). Docs must keep these scopes straight — `/signals/alerts` lives under the Signals tab, `/platform/reports` under Platform.
- Alert types are `SIGNAL_EVENT` and `NEW_CLUSTER`. `skipSimilar` and `NEW_CLUSTER` both depend on the clustering service and are gated behind `Feature.CLUSTERING` in the UI — call this out explicitly in any doc that mentions them.
- Every new Signal auto-creates a Critical-severity `SIGNAL_EVENT` alert plus (when clustering is on) a `NEW_CLUSTER` alert, both defaulting to in-app only. The `/signals/quickstart` Note must stay in sync with this behavior if the default-alert logic changes.
- Reports post to the in-app notification center only for short periods (≤3 days); weekly-style rollups are suppressed in-app to avoid duplicating daily summaries (see `formatReportNotification` in `frontend/components/notifications/notification-panel.tsx`). Reflect this when describing in-app behavior.

## Claude Agent SDK integration

- Public TS API is `Laminar.wrapClaudeAgentQuery(originalQuery)` (alias: module-level `instrumentClaudeAgentQuery`). Document the static-method form; it's the one in the TSDoc example.
- Python integration is auto-instrumented by `Laminar.initialize()` when `claude-agent-sdk` is importable. There is NO `[claude-agent-sdk]` extra in `lmnr`'s `pyproject.toml`; install is `pip install lmnr claude-agent-sdk`. Don't repeat the old `pip install -U 'lmnr[claude-agent-sdk]'` pattern.
- Subagents only become nested spans if `Agent` is in `allowedTools` / `allowed_tools` and subagents are declared in `agents`. The tool was `Task` before Claude Agent SDK v2.1.63.
- Python ships a Rust proxy (`lmnr-claude-code-proxy`) that binds to port 45667 to intercept Anthropic HTTP calls from subprocess subagents. If `ANTHROPIC_BASE_URL` is pre-set (common in sandboxes/agent runtimes), the proxy fails with "Address already in use" and subagent spans go missing — `unset ANTHROPIC_BASE_URL ANTHROPIC_BEDROCK_BASE_URL ANTHROPIC_ORIGINAL_BASE_URL` before running demos.
- When running CAS demos inside another claude-agent sandbox, the parent agent already owns port 45667 for its own proxy. Override before `Laminar.initialize()` via module-level monkey-patch: `from lmnr.opentelemetry_lib.opentelemetry.instrumentation.claude_agent import proxy as _p; _p._DEFAULT_PORT = 55667; _p._NEXT_PORT = 55667`. No public env var exists for this today.
- Traces from the running background agent land in the same project as the demo you're running, so transcript screenshots can be polluted by the agent's own Bash/Read spans. Filter the trace list by root-span name (e.g. `multi-agent-code-review`) before screenshotting, or run the demo in a project separate from `LMNR_PROJECT_API_KEY`.

## Formatting

- Run `prettier --write` ONLY on the specific files you changed. Never `pnpm format:write` or `prettier --write .`; it touches unrelated files. Note that the docs repo itself has no `package.json` or prettier config, so prettier is not part of the workflow here.
