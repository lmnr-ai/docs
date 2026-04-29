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
- `npx mintlify broken-links` parses every `.md`/`.mdx` under the cwd, including this `CLAUDE.md`. A parse error here (e.g. a literal `<X>` in prose) aborts the run before any broken-link output is printed. If the check dies on `CLAUDE.md`, temporarily `mv CLAUDE.md .CLAUDE.md.bak`, rerun, then restore. Long-term fix: escape stray `<tag>`-looking tokens in this file.

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
- For the **Sessions** section (`/tracing/structure/sessions`) after LAM-1438-2 / PR #1656: the old expandable-row drawer is gone. Clicking a row in the Sessions table at `/project/<id>/traces?view=sessions` (actual path is server-side; the tab is labeled `Sessions` next to `Traces`/`Spans`) navigates to `/project/<id>/sessions/<sessionId>`. The detail page has a `sessions / <sessionId>` breadcrumb, three stats shields (duration / tokens / cost), a `Timeline` toggle, a search box, and numbered trace cards (`1/5`, `2/5`, …) with an auto-extracted `Input` block plus the last LLM-span output. Docs must show BOTH the table view and the detail view. Seed at least two sessions with real OpenAI/Anthropic calls (not just raw `@observe`'d functions) so the Input/Output previews are populated — sessions without LLM spans render a thin card that does not demo the new UI.

## Trace view naming

- The UI labels the default view **Transcript** (see `frontend/components/traces/trace-view/view-dropdown.tsx`: `label: "Transcript"`). Docs must call it "Transcript view," not "Reader Mode" — the old Reader Mode label is dead. Canonical page is `/platform/viewing-traces` (under it: `#transcript-view`, `#tree-view`, `#timeline`, `#metadata`, `#chat-with-trace`).
- When citing user-facing transcript behavior, describe the **three primitives** surfaced for free: (1) auto-extracted `Input` block on every agent and subagent (parsed from system + user messages, no instrumentation required), (2) subagents render as collapsible cards with Input/Output previews that expand in place, (3) one-line inline previews on LLM turns and tool-call rows. These are the selling points vs. a span tree.

## Span types in manual instrumentation

- Transcript view is driven by span **type**, not span name. It renders the user input, LLM turns, tool calls, and subagent cards; `DEFAULT` spans are filtered out and only visible in Tree view (see `frontend/components/traces/trace-view/transcript/index.tsx` and `store/utils.ts`). A manually-instrumented tool wrapped with `@observe()` shows up in Tree view but NOT in transcript view unless you pass `span_type="TOOL"` / `spanType: "TOOL"`. This is the single highest-leverage instrumentation change for agent traces.
- Dedicated page for this lives at `/tracing/structure/span-types`. Integration and guide pages that describe manual tool wrapping should link there instead of re-explaining the TOOL/DEFAULT distinction inline.
- Python SDK supports `Literal["DEFAULT", "LLM", "TOOL"]` on `@observe(span_type=...)` / `Laminar.start_as_current_span(span_type=...)` / `start_active_span` / `start_span`. TypeScript supports the full `SpanType` union (adds `EXECUTOR`, `EVALUATOR`, `HUMAN_EVALUATOR`, `EVALUATION`, `CACHED`) — user-facing docs keep the value sets aligned but should document only `DEFAULT` / `LLM` / `TOOL` as the types a human should reach for. The others are for the evaluations framework or internal auto-instrumentation.
- For a clean TOOL-vs-DEFAULT comparison screenshot, run the same agent twice — once with `span_type="TOOL"` on each tool function, once without — against the same prompt. The BEFORE shot shows only LLM turns (no tool rows); the AFTER shot interleaves bolt-icon tool rows. `/sandbox/scratch/tool_span_demo.py` + `/sandbox/scratch/default_span_demo.py` hold the canonical pair; keep them in sync if the demo needs re-shooting.

## Voice gotchas not caught by linters

- `grep "[em-dash]" <file>` before committing. Em dashes should not appear in docs prose; they sneak in easily from copy-paste. `<Frame caption="...">` strings are a frequent source — prefer a colon over an em dash inside captions.
- `grep -E "seamless|powerful|unleash|cutting-edge|best-in-class|revolutionary|supercharge"` returns banned marketing words.
- Every integration page needs the three forward links in data-flow order: viewing traces, then Signals, then SQL access (editor/API/MCP).
- The **Track outcomes with Signals** section on every tracing integration page must frame Signals as the *cross-trace* layer, not a "extract stuff from one trace" feature. The template: contrast traces (*what happened on this run*) with Signals (*how often / when / which runs* — the question that only makes sense across many traces), explain that a Signal pairs a plain-language prompt with a JSON output schema, mention Triggers (live) and Jobs (backfill), and finish with the `[query](/platform/sql-editor), [cluster](/signals/clusters), and [alert](/signals/alerts)` inline-bold triplet. Always include a `<Note>` about the Failure Detector Signal shipped with every new project. The "extracts matching events across your history and every new trace" wording from prior versions understates what Signals do — don't revert to it.

## Example code conventions

- **Always use the newest model for each provider.** In any Python string literal, TS SDK init call, or CLI invocation that names a model, use the latest release (e.g. `gpt-5-mini` / `gpt-5` family, not `gpt-4.1-mini`). Older models make pages read as stale and point readers at discontinued SKUs. This applies to sandbox demos too — their output lands in trace screenshots that ship here.
- **Format "What's next" as a two-column CardGroup**, not a bullet list. Every page closing with a "What's next" section uses `<CardGroup cols={2}>` of `<Card title="..." href="...">` elements with one-sentence bodies. Keep the card count even so the grid stays square. The `analyze.mdx` / `platform.mdx` hub pages already follow this pattern; integration pages match it.

## Prose style Robert favors (observed from edits on `signals/introduction.mdx`)

- **Use italics for rhetorical hypotheticals**, not plain quotes. `*did it get stuck, did the user give up*` reads better than `"did it get stuck..."`.
- **Use bold for the thesis sentence and the call-to-action phrase**, and inline links inside the bold (`**[query](...), [cluster](...), and [alert](...) on**`). It lets the eye land on the payoff.
- **Lead with the image early**, not after several sections of exposition. First image should sit right after the opening pitch so scanners see the product.
- **Three-column `<CardGroup>` feels crowded**; default to `cols={2}` for next-step nav.
- **Drop fields that are self-evident** from surrounding context. When listing the parts of an object, don't enumerate every attribute — skip the ones a reader would assume exist (e.g. a Name on a Signal). Trim to the parts that are actually interesting to describe.
- **Conversational H2s**: prefer "Run a Signal on new traces or historical traces" over "Ways to run a Signal". Headers can be long if they answer a question directly.
- **Concrete speech, not abstract definitions**: "If you've written a Slack message that starts with 'can you look through today's runs...'" beats "Signals are for open-ended investigations".
- Keep one or two `<Note>` callouts per page for side information that would otherwise break flow (e.g. "these are queryable via `signal_events`"). Don't inline the detail into prose.

## Dashboards

- The Dashboards page (`/custom-dashboards/overview`) lives under the **Platform** sidebar group, not its own tab — the file path is legacy (`custom-dashboards/`), but the product is simply "Dashboards" now. Use that label in prose; the sidebar label in the Laminar app reads `dashboards` (lowercase).
- Chart types in the UI are `LineChart`, `BarChart`, `HorizontalBarChart`, and `Table` (defined in `frontend/components/chart-builder/types.ts`). The `feat: Dashboards Enhancement` commit (eedbf77) briefly referenced a Metric type in its message, but it was not kept in the shipped enum — do not document Metric as a chart type.
- Chart presets are defined in `frontend/components/dashboards/chart-presets.ts` and grouped by table (`traces` / `spans` / `signals`). When listing them in docs, keep the order the array uses so the tabs in screenshots match the text. The **Custom** entry in the `+ Chart` popover is the blank chart builder, not a preset category.
- Click-to-trace on horizontal bar and table charts depends on `injectIdMetrics` adding a hidden `__hidden_trace_id` / `__hidden_span_id` / `__hidden_id` column. Only tables that actually have that id column (`traces`, `spans`, `signal_events`) get clickable rows; others render as plain charts. Don't promise clickable rows for chart types other than Horizontal Bar and Table.
- Drag-to-select fires `SelectionToolbar` (`frontend/components/dashboards/selection-toolbar.tsx`). "Zoom to selection" rewrites `startDate` / `endDate` on the dashboard URL and deletes `pastHours`; "Open in traces" opens `/project/<pid>/traces?startDate=...&endDate=...` in a **new tab** via `window.open`. Describe it as a new-tab action in docs — readers lose their dashboard selection otherwise.
- The `Display Value` selector only applies to Line and Bar charts (Horizontal Bar and Table hide it). Values are `none` / `total` / `average`; the legacy `total: true` flag still resolves to `"total"` via `resolveDisplayMode` for backward compatibility. Don't document an "average by bucket" or "latest value" mode — those don't exist in the current enum.
- The **Custom SQL metric** (`fn: "raw"`, label "Custom SQL" in `frontend/components/dashboards/editor/constants.ts`) swaps the column picker for a schema-aware SQL editor. Whatever the user types is injected as `SELECT <expr> FROM <table>` — they write a single projection (`countIf(...)`, `quantile(0.75)(duration)`, etc.), NOT a full query. Group-by and filters are applied by the builder around the expression, so docs should tell readers NOT to write their own `GROUP BY`/`WHERE`. The in-app inline link points at `https://laminar.sh/docs/platform/sql-editor#table-schemas`; keep docs on the same anchor.
- **Custom columns on Table charts** use the same `fn: "raw"` mechanism (`frontend/components/dashboards/editor/fields/columns-row.tsx`) via a `Custom SQL` entry at the bottom of the column dropdown. Distinction between data-column and custom-column is encoded by the alias: data columns set `alias === column` and `column ∈ table schema`; custom columns get a random `column_xxxxxx` alias from `generateCustomAlias` so reorder/remove doesn't rename them. Don't describe the header as user-editable inline — it's stable-random unless the user renames via the column list.
- **`tags` is no longer a chart-builder table.** Dashboards expose `traces`, `spans`, and `signal_events` only — `tags` was removed from the chart-builder enumerable tables. Don't list `tags` in any "Table" enumeration on the dashboards page or in example metric queries. (Note: tags still exist as an `Array(String)` column on `spans` and `traces` in the SQL editor schemas; that's unrelated.)

## Evaluations

- **Online evaluators are dead.** The `Online Evaluators` subgroup (`evaluations/online-evaluators/*`) was removed from the product in April 2026. Do not reintroduce pages for online evaluators, hosted evaluators, or span-path / SDK-based online scoring. The remaining evaluator types are: code evaluators (pure functions), LLM-as-a-judge (functions that call an LLM), and `HumanEvaluator()`.
- **Canonical evaluations layout** (under the `Evaluations` group in `docs.json`): `introduction`, `quickstart`, `concepts`, `comparing-runs`, `datasets`, `manual-evaluation`, `self-hosted`. The `human-evaluators.mdx` file still exists on disk and in the SDK but is hidden from the sidebar as of LAM-1505 phase 2 (leave the file; just keep it out of `docs.json` and remove inbound cross-links from the other evaluation pages).
- **Manual API: TS and Python diverge on trace linking.** Python's `client.evals.update_datapoint` accepts `trace_id`, so the canonical pattern is `create_datapoint` (before the span opens, row visible in UI) → open `EVALUATION` span → `update_datapoint(scores={}, trace_id=Laminar.get_trace_id())` → run executor → `update_datapoint(executor_output, scores)`. TypeScript's `updateDatapoint` does NOT take `traceId` (verified in `@lmnr-ai/lmnr@0.8.20` dist): the only hook is `createDatapoint({..., traceId: Laminar.getTraceId()})` from inside the `EVALUATION` `observe` block. Don't write a TS example that passes `traceId` to `updateDatapoint`; it silently gets ignored.
- **Python `save_datapoints` requires full `EvaluationResultDatapoint` objects, not dicts** — includes mandatory `id`, `trace_id`, and `executor_span_id` UUIDs. For backfills where those aren't meaningful, loop `create_datapoint` + `update_datapoint` per row instead of calling `save_datapoints` directly. TS `saveDatapoints` takes a looser shape but is still the path for bulk writes when you already have a trace_id per row.
- **Compare-view capture**: the `?comparedEvaluationId=<uuid>` URL param is NOT respected on direct load; the page redirects to the group list. To capture the comparison view, navigate to the single-evaluation detail page first, then click the **Select compared evaluation** combobox (ref typically `e4` in `agent-browser snapshot`) and pick the other run from the dropdown. Switching the score-metric selector after compare is set works, but clicking it while a compare is active and re-selecting may detach the compared run — re-pick both if the view collapses back to the single-eval layout.
- **Span schema** every datapoint produces: `EVALUATION` root → `EXECUTOR` child → any auto-instrumented LLM/tool spans → one `EVALUATOR` span per scoring function. `HumanEvaluator()` produces a `HUMAN_EVALUATOR` span. All are queryable via `spans` with `evaluation_id = '<uuid>'`.
- **Storage split**: Postgres `evaluations` holds one row per run (name, group, metadata); ClickHouse `evaluation_datapoints` holds one row per datapoint (`data`, `target`, `metadata`, `executor_output`, `scores`, `trace_id`, duration, cost). `evaluation_datapoints.scores` is a `Map(String, Float64)`, queryable as `ed.scores['accuracy']` in SQL.
- **Voice template for new evaluation pages**: follow `signals/introduction.mdx`. Open with a bold thesis sentence containing 2-3 inline links (e.g. `**[compares them](/evaluations/comparing-runs) across [runs](/evaluations/concepts) and [groups](...)**`). Use italics for rhetorical hypotheticals (`*is this version better*`). Put the primary `<Frame>` image right after the opener, not after multiple sections. Close with `<CardGroup cols={2}>` (four cards, two wide), not a bullet list.

## Alerts and reports coupling

- Alerts are **project-level** (`/repos/lmnr/app-server` writes to `alerts` / `alert_targets`); reports are **workspace-level** (`reports` / `report_targets`). Both live under the Signals sidebar group in `docs.json` (`/signals/alerts` and `/signals/reports`), since they're the two notification-channel primitives for Signals.
- Alert types are `SIGNAL_EVENT` and `NEW_CLUSTER`. `skipSimilar` and `NEW_CLUSTER` both depend on the clustering service and are gated behind `Feature.CLUSTERING` in the UI — call this out explicitly in any doc that mentions them.
- Every new Signal auto-creates a Critical-severity `SIGNAL_EVENT` alert plus (when clustering is on) a `NEW_CLUSTER` alert, both defaulting to in-app only. The `/signals/quickstart` Note must stay in sync with this behavior if the default-alert logic changes.
- Reports post to the in-app notification center only for short periods (≤3 days); weekly-style rollups are suppressed in-app to avoid duplicating daily summaries (see `formatReportNotification` in `frontend/components/notifications/notification-panel.tsx`). Reflect this when describing in-app behavior.
- Report names are derived from the schedule via `getReportLabel` in `frontend/lib/actions/reports/types.ts`: Mon–Fri → **Weekday signals summary**, single day → **Weekly signals summary**, all 7 → **Daily signals summary**. Docs must use the same label the UI renders (the two defaults are *Weekday* and *Weekly*, not "Daily" and "Weekly").
- Alert trigger labels in the UI come from `ALERT_TYPE_LABELS` in `frontend/lib/actions/alerts/types.ts`: `SIGNAL_EVENT` → **New event**, `NEW_CLUSTER` → **New cluster**. Docs should use these user-facing labels, not the raw enum names, when describing the trigger picker or alert rows.

## Claude Agent SDK integration

- Public TS API is `Laminar.wrapClaudeAgentQuery(originalQuery)` (alias: module-level `instrumentClaudeAgentQuery`). Document the static-method form; it's the one in the TSDoc example.
- Python integration is auto-instrumented by `Laminar.initialize()` when `claude-agent-sdk` is importable. There is NO `[claude-agent-sdk]` extra in `lmnr`'s `pyproject.toml`; install is `pip install lmnr claude-agent-sdk`. Don't repeat the old `pip install -U 'lmnr[claude-agent-sdk]'` pattern.
- Subagents only become nested spans if `Agent` is in `allowedTools` / `allowed_tools` and subagents are declared in `agents`. The tool was `Task` before Claude Agent SDK v2.1.63.
- Python ships a Rust proxy (`lmnr-claude-code-proxy`) that binds to port 45667 to intercept Anthropic HTTP calls from subprocess subagents. If `ANTHROPIC_BASE_URL` is pre-set (common in sandboxes/agent runtimes), the proxy fails with "Address already in use" and subagent spans go missing — `unset ANTHROPIC_BASE_URL ANTHROPIC_BEDROCK_BASE_URL ANTHROPIC_ORIGINAL_BASE_URL` before running demos.
- When running CAS demos inside another claude-agent sandbox, the parent agent already owns port 45667 for its own proxy. Override before `Laminar.initialize()` via module-level monkey-patch: `from lmnr.opentelemetry_lib.opentelemetry.instrumentation.claude_agent import proxy as _p; _p._DEFAULT_PORT = 55667; _p._NEXT_PORT = 55667`. No public env var exists for this today.
- Traces from the running background agent land in the same project as the demo you're running, so transcript screenshots can be polluted by the agent's own Bash/Read spans. Filter the trace list by root-span name (e.g. `multi-agent-code-review`) before screenshotting, or run the demo in a project separate from `LMNR_PROJECT_API_KEY`.

## Mastra integration

- `MastraExporter` is Mastra-specific and plugs into Mastra's own `Observability` config — it is NOT a standalone initializer like Vercel AI SDK's `getTracer()`. Shape: `new Observability({ default: { enabled: false }, configs: { <name>: { serviceName, exporters: [new MastraExporter()] } } })`. Minimum versions: `@lmnr-ai/lmnr >= 0.8.21`, `@mastra/core >= 1.0.0`, `@mastra/observability >= 1.0.0` — `@mastra/core@1.0.0` is the first stable with the `ObservabilityEntrypoint` field on `new Mastra({ observability })` and matching `Observability` class in `@mastra/observability@1.0.0`. Don't bump these to a higher floor unless a new API is actually needed.
- `default: { enabled: false }` is load-bearing. Omitting it double-emits spans via Mastra's built-in default exporters alongside Laminar. Always call it out in docs.
- Mastra's `Observability` has NO `.flush()` method — `await observability.shutdown()` IS the flush path. Document `observability.shutdown()` before `Laminar.shutdown()` on every end-of-script example.
- `MastraExporter({ linkToActiveContext: true })` is the default. When a Mastra agent runs inside an active OTel span (e.g. `observe()` or `@vercel/otel`), the exporter rewrites Mastra trace ids onto the caller's trace so `observe()` root + Mastra subtree render as one trace. Readers hitting "two separate traces" have overridden this to `false` or called `Laminar.initialize()` after `new Mastra(...)`.
- `MastraExporter({ realtime: true })` force-flushes on every span end; use for scripts/serverless. Leave default for long-running services.
- Mastra AI SDK v6 tool `execute` takes `(inputData)` whose fields are under `inputData.context` — NOT destructured at top level. `execute: ({ from, to }) => ...` silently receives `undefined`. Write `execute: (inputData) => { const { from, to } = inputData.context; ... }`.
- Mastra v1.28 removed `maxSteps`; use `stopWhen: ({ steps }) => (steps?.length ?? 0) >= N` (or the `stepCountIs` helper from the AI SDK equivalent). Older docs showing `maxSteps` are wrong.
- Multi-subagent demo shape: wrap each sub-agent in a `createTool({ execute: async (inputData) => { const res = await subAgent.generate(...); return {...}; } })`. Laminar nests the sub-agent's full run (its own turns and tool calls) under the parent tool span. Rich tree-view screenshots come from this pattern (concierge → bookFlight tool → flight-agent run → gpt-5-mini LLM → lookup_flights tool). Flat-single-agent demos look thin by comparison.
- When shipping both transcript- and tree-view screenshots (`/images/traces/<integration>.png` + `<integration>-tree.png`), verify each filename matches what the image actually shows before committing — the `Tree`/`Transcript` dropdown label in the top-left of the trace pane is the ground truth, and the right-hand Span Input/Output panel alone cannot tell the two views apart. Misfiled screenshots ship silently: the page builds, Mintlify renders, and only a reviewer comparing caption to pixels notices.

## OpenAI Agents SDK integration

- Python integration is auto-instrumented by `Laminar.initialize()` when `openai-agents` is importable. No wrapping call like `wrapClaudeAgentQuery` exists. Install is `pip install lmnr openai-agents`; there is no `[openai-agents]` extra.
- Requires `openai-agents >= 0.7.0` and `lmnr >= 0.7.48`. The instrumentor initializer is gated by `is_package_installed("openai-agents")` in `_instrument_initializers.py`.
- The integration hooks `agents.tracing.add_trace_processor` (not OTel model wrapping) via `LaminarAgentsTraceProcessor`, and additionally wraps `OpenAIResponsesModel.get_response/stream_response` + the Chat Completions variants to inject the agent's `instructions` into the input messages via a ContextVar. That's why system prompts show up on every LLM span without the user opting in.
- Span hierarchy: root `@observe` → `Agent workflow` → `agents.task` → `<AgentName>` → `agents.turn` → `<model>` LLM span (e.g. `gpt-5-mini`). Handoffs appear as a `transfer_to_<agent>` tool call on the source agent followed by an `agents.handoff` span; the destination agent's turns land as siblings under the same parent task — they do NOT nest under the source agent. Recommend tree view in docs when describing handoff structure.
- For screenshots, the transcript view needs `Runner.run` to produce at least one tool call or handoff to be visually interesting; a single-turn math tutor run fills most of the screenshot with the prompt. Use a multi-agent airline-style demo for the multi-agent screenshots.
- Default `Laminar.initialize()` targets cloud on port 8443 over gRPC/HTTPS. For local stack testing always pass `base_url="http://localhost", http_port=8000, grpc_port=8001` — otherwise the demos silently send to cloud.

## Pydantic AI integration

- Auto-instrumented by `Laminar.initialize()` when `pydantic-ai-slim` (or full `pydantic-ai`) is importable. No `Agent.instrument_all()` call or manual OTLP exporter setup is needed; the integration monkey-patches `InstrumentationSettings` to use Laminar's tracer provider for every `Agent` constructed after init. Don't document the old OTLP-exporter pattern.
- Requires `pydantic-ai-slim >= 1.0.0` and `lmnr >= 0.7.49`. Released in lmnr-python PR #283.
- When Pydantic AI is auto-enabled, Laminar auto-REMOVES the overlapping raw provider instrumentors (OpenAI, Anthropic, Google GenAI, Groq, Mistral, Cohere, Bedrock) from the default set because Pydantic AI already emits GenAI-semconv spans at the model abstraction layer. Running both would double-count every model call. Opt back into both with an explicit `instruments={Instruments.PYDANTIC_AI, Instruments.OPENAI, ...}` set.
- Span names follow OTel GenAI semconv: `agent run`, `chat <model>` (per turn), `execute_tool <name>` (per tool call). Nesting mirrors the conversation — tool spans sit under the chat turn that invoked them.
- Tools registered with `@agent.tool_plain` (no `RunContext`) work out of the box; `@agent.tool` is the variant with injected dependencies. Both emit `execute_tool <name>` spans identically.
- **Multi-agent delegation pattern**: Have a coordinator `Agent` expose `@agent.tool` methods that internally call `await sub_agent.run(...)`. Laminar nests the sub-agent's full run (its own turns and tool calls) directly underneath the parent `execute_tool <name>` span. This is the shape Rainhunter13 asked for in PR #139 — it produces rich tree-view screenshots (concierge → gpt-5-mini → book_flight → flight_agent → gpt-5-mini → search_flights). Single-agent-with-flat-tools demos look thin by comparison.
- Opening paragraphs on integration pages should lead with "Laminar is an open-source, OpenTelemetry-native observability platform for AI agents" (generic), then name the framework in the *second* clause ("...Trace, debug, and monitor every [Framework] ..."). Phrasing the opener as "observability platform for [Framework]" reads like the platform only serves that one framework — Rainhunter13 flagged this on PR #139.

## Formatting

- Run `prettier --write` ONLY on the specific files you changed. Never `pnpm format:write` or `prettier --write .`; it touches unrelated files. Note that the docs repo itself has no `package.json` or prettier config, so prettier is not part of the workflow here.
