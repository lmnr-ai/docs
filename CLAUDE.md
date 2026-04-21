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
- Trace view has an inner scrollable container, so `agent-browser scroll down` moves the outer page (usually a no-op) instead of the transcript. Scroll it via `agent-browser eval "document.querySelector('.styled-scrollbar.overflow-x-hidden').scrollTop = N"`.
- To dismiss the "New: Transcript view" hint popover for clean screenshots, set `localStorage['trace-view:transcript-hint-dismissed'] = 'true'` on a non-trace page first, then navigate to the trace URL. The component reads localStorage only at mount, so setting it after the trace page loads does nothing.
- Close the "Signal events" side panel (button in the top toolbar, next to Tags) before screenshotting — a trace with signals attached shows it by default and steals half the viewport.

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

## Formatting

- Run `prettier --write` ONLY on the specific files you changed. Never `pnpm format:write` or `prettier --write .`; it touches unrelated files. Note that the docs repo itself has no `package.json` or prettier config, so prettier is not part of the workflow here.

## Claude Agent SDK integration specifics

- Laminar's transcript view detects subagent boundaries by matching the orchestrator's subagent-spawn prompt hash against the first LLM call inside the subagent (`computeSubagentBoundaries` in `frontend/components/traces/trace-view/store/utils.ts`). Grouping is tool-name agnostic, so it works for both the legacy `Task` tool name and the current `Agent` tool name. Integration docs can promise this works without any user annotation.
- The subagent tool was renamed from `Task` to `Agent` in Claude Code v2.1.63. Current SDK docs use the `agents=` parameter with `AgentDefinition`, and require `"Agent"` in `allowed_tools`/`allowedTools`. Older `system:init` payloads and `result.permission_denials[].tool_name` can still use `"Task"`, so when writing detection code mention matching both names.
- Don't rely on memorized API shapes for fast-moving SDKs — verify the current Claude Agent SDK shape against https://code.claude.com/docs/en/agent-sdk/ (subagents + overview pages) before writing examples. The canonical host has moved: `docs.claude.com` 301s to `platform.claude.com` which 307s to `code.claude.com`.
- Python integration is an extra: `pip install 'lmnr[claude-agent-sdk]'`. Don't imply it ships in the default `lmnr` package.
- The Python SDK's `Laminar.initialize()` defaults to `https://api.lmnr.ai` and does NOT read `LMNR_BASE_URL`/`LMNR_HTTP_PORT`/`LMNR_GRPC_PORT` env vars for ports. To point at a local stack, pass `base_url`, `http_port`, `grpc_port` explicitly. Keep examples in docs simple (`Laminar.initialize()` with no args) since users ship to cloud by default.
