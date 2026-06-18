# Research Agents

This document defines the local research workflow roles for this project. These are process roles, not autonomous tools.

## Principal Investigator

The human user decides:

- final novelty claim,
- venue target,
- model/API budget,
- ethical framing,
- whether evidence is strong enough to submit.

## Codex Research Assistant

Codex may:

- inspect and modify local research artifacts,
- search and verify literature from primary sources,
- draft paper-as-code sections,
- create schemas and experiment plans,
- implement research harness code when requested,
- run local validation commands.

Codex must not:

- invent citations, papers, DOI values, experiments, or results,
- treat unverified web snippets as fully read papers,
- claim publication readiness without running the research gates,
- overwrite unrelated user work.

## Evidence Policy

All major paper claims must be tied to one of:

- verified source,
- local code or schema,
- experiment output,
- explicit `[NEED_SOURCE]`,
- explicit `[NEED_EXPERIMENT]`,
- explicit `[AUTHOR_DECISION]`.

## Current Research Frame

The paper studies **verifiable multi-agent reasoning** in **zero-communication mixed-motive games**, using Guandan as the primary dense testbed. The paper is not framed as a stronger Guandan bot.
