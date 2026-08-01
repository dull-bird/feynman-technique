# Feynman Technique (feynman-technique)

[中文版 README](README.md)

A Feynman Technique AI coach that lives in your terminal: you explain, it probes. The AI plays a zero-background but logically rigorous listener that keeps asking questions, exposes your knowledge gaps, and logs every session to track your progress over time.

**Site & 3-minute intro video: <https://dull-bird.github.io/feynman-technique/>** (English version at `/en/`)

## Install

```bash
npx skills add dull-bird/feynman-technique -g
```

Or manually:

```bash
git clone https://github.com/dull-bird/feynman-technique.git
cp -r feynman-technique/feynman-technique ~/.agents/skills/feynman-technique
```

Then just tell your agent: "Use the Feynman technique on compound interest" (or 「用费曼学习法，概念是 XX」).

Everything is driven by natural language — asking for progress reports, reviewing past sessions, or exporting to Obsidian requires no Python and no commands from you.

### Auto-trigger (optional)

Install a UserPromptSubmit hook so saying "feynman" / 「费曼」 / 「是否真懂」 automatically invokes the skill (Claude Code / Codex / Kimi Code):

```bash
python3 ~/.agents/skills/feynman-technique/scripts/install_hooks.py            # all agents
python3 ~/.agents/skills/feynman-technique/scripts/install_hooks.py --agent kimi
python3 ~/.agents/skills/feynman-technique/scripts/install_hooks.py --uninstall
```

The hook injects only a compact pointer to SKILL.md (details live in the file, not the hook). Idempotent, uninstallable, and it leaves your other hooks untouched.

## How it works

- **Prepare**: before each session the listener researches the concept (web search; your own materials take priority), decomposes it from first principles, sets 5–8 mastery checkpoints, and reviews your learning history (`report --json`) to target old gaps.
- **Probe**: one question at a time, always quoting your own words, classified by a 7-category gap taxonomy (factual errors first).
- **Scaffold**: hints are capped (60–100 words + one example), and a scaffolded re-explanation does not count as mastery — you must re-explain from a fresh angle.
- **Mastery**: five criteria — term independence, causal chain, mechanism transparency, boundary differentiation, stress test.
- **Review card**: after each session you get a refined explanation (in your own words), an analogy with its limits, and 3 transfer questions.
- **State machine**: `feynman_session.py` keeps the process honest (round caps, valid gap codes, automatic logging) so long conversations never drift.

## Repository layout

- `feynman-technique/` — the skill itself (only this directory gets installed by npx skills)
  - `SKILL.md` — session flow
  - `references/method.md` — listener rules, preparation duties, scoring rubric
  - `scripts/feynman_log.py` — logs & reports (`log` / `report` / `export`, stdlib only)
  - `scripts/feynman_session.py` — session state machine (`start` / `round` / `status` / `close` / `abort`)
  - `scripts/feynman_hook.py` + `install_hooks.py` — auto-trigger hooks
  - `scripts/test_feynman_log.py` — pexpect end-to-end tests
  - `scripts/build_gallery.py` — builds website gallery data from real sessions
- `sessions/` — local learning records (gitignored)
- `docs/` — GitHub Pages site (with a gallery of real sessions)
- `video/` — Remotion video source

## Export to Obsidian

```bash
python3 feynman-technique/scripts/feynman_log.py export --vault ~/Documents/MyVault/feynman
```

Generates Obsidian-compatible notes: one per concept (frontmatter, score trend, session links), one per session (full transcript + review card), plus an index — queryable with Dataview.

## Development

```bash
# Enable pre-commit checks (runs e2e tests and rebuilds gallery data on every commit)
git config core.hooksPath .githooks

# Run tests manually (needs pexpect: python3 -m venv .venv && .venv/bin/pip install pexpect)
.venv/bin/python feynman-technique/scripts/test_feynman_log.py

# Rebuild gallery data after new sessions
python3 feynman-technique/scripts/build_gallery.py
```

## Method

The four-step loop: write the concept down → explain to an outsider → identify gaps → simplify and analogize, looping until fluent. Real understanding means explaining *why*, not just describing *what*. (The Feynman Technique itself was not invented by Feynman — it was distilled from his teaching style; see the source videos linked on the site.)
