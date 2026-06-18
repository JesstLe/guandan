# AAMAS-Style LaTeX Draft

This directory contains a first AAMAS-style LaTeX draft compiled from the
Research OS manuscript artifacts.

Build command:

```bash
tectonic main.tex
```

Notes:

- The source uses ACM `acmart` in anonymous review mode as the closest local
  proxy for recent AAMAS LaTeX templates.
- `main.tex` cites the shared bibliography at `../references.bib`.
- Figure 1 is drawn in native TikZ so the draft can compile without an external
  SVG conversion tool.
- The authoritative page-limit snapshot is `../page-budget.md`.
