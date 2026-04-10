# CLAUDE.md

This file provides guidance to Claude Code when working with the Laminar documentation repository.

## Project Overview

Mintlify-based documentation site for [Laminar](https://lmnr.ai). Pages are `.mdx` files using Mintlify components (`Card`, `CardGroup`, `Tabs`, `Tab`, `Steps`, `Step`, `Note`, `Warning`, `Expandable`).

## Structure

- **docs.json** — Navigation config (equivalent to `mint.json` in older Mintlify versions). All new pages must be added here.
- Pages are organized by section: `tracing/`, `evaluations/`, `datasets/`, `platform/`, `guides/`, `sdk/`.

## Key Conventions

- Navigation order in `docs.json` determines sidebar order. The "Platform" group controls the order for platform feature pages.
- Use `<Card>` / `<CardGroup>` for CTA links between related pages. Use `icon="terminal"` for CLI references, `icon="bug"` for debugger links.
- The `lmnr-cli` npm package is the canonical CLI tool (language-agnostic). The Python `lmnr` package provides a `lmnr` CLI for Python-specific commands (evals, discover). Documentation should point to `lmnr-cli` for dataset, dev, and sql commands.
- Anchor links to sections use lowercase, hyphenated IDs derived from headings. For custom anchor IDs, use `{"\#custom-id"}` syntax after the heading text.
