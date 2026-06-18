# Citation Integrity Audit

Date: 2026-06-17

This file tracks source-existence and metadata status for works that are likely to appear in the final paper. It is not a final bibliography.

## Closest-Neighbour Sources

| Key | Source | Local Evidence | DOI / Identifier | Status | Use In Paper |
|---|---|---|---|---|---|
| `yim2024tomguandan` | https://arxiv.org/abs/2408.02559 | `papers/yim2024tomguandan.pdf`, `papers/yim2024tomguandan.txt` | `10.48550/arXiv.2408.02559` | verified | closest LLM Guandan / ToM / zero-communication baseline |
| `agashe2023llmcoordination` | https://arxiv.org/abs/2310.03903 | `papers/agashe2023llmcoordination.pdf`, `papers/agashe2023llmcoordination.txt` | `10.48550/arXiv.2310.03903` | verified | pure coordination, ToM, joint planning, answer verification comparison |
| `ramesh2026hanabi` | https://arxiv.org/abs/2601.18077 | `papers/ramesh2026hanabi.pdf`, `papers/ramesh2026hanabi.txt` | `10.48550/arXiv.2601.18077` | verified | cooperative card-game reasoning traces and move utilities |
| `lu2022danzero` | https://arxiv.org/abs/2210.17087 | `papers/lu2022danzero.pdf`, `papers/lu2022danzero.txt` | `10.48550/arXiv.2210.17087` | verified | Guandan RL/game-strength context |
| `xie2026m3bench` | https://arxiv.org/html/2601.08462v2 | arXiv HTML read | arXiv identifier recorded | source exists; DOI not recorded | process-aware mixed-motive evaluation |
| `openguandan2026` | https://arxiv.org/html/2602.00676v1 | arXiv HTML read | arXiv identifier recorded | source exists; DOI not recorded | Guandan benchmark/simulator context |
| `aaai2025mixedexplain` | https://arxiv.org/html/2407.15255v2 | arXiv HTML read | AAAI/arXiv source recorded | source exists; venue metadata not normalized | mixed-motive explanation and implicit communication |
| `he2026stratreasoner` | https://arxiv.org/html/2605.04906v2 | arXiv HTML read | arXiv identifier recorded | source exists; DOI not recorded | LLM strategic reasoning in multi-agent games |
| `lin2026toolpoker` | https://arxiv.org/html/2602.00528v1 | arXiv HTML read | arXiv identifier recorded | source exists; DOI not recorded | hidden-information game reasoning traces and knowing-doing gaps |

## Background Sources

| Key | Source | Current Evidence | Status | Use Constraint |
|---|---|---|---|---|
| `ramesh2025activationcomm` | https://arxiv.org/html/2501.14082v2 | arXiv HTML read | source exists | cite as communication contrast only |
| `yang2025codeagents` | https://arxiv.org/abs/2507.03254 | arXiv abstract read | source exists; needs full read if central | cite as structured reasoning background only |
| `li2025gametheorysurvey` | https://arxiv.org/html/2502.09053v2 | arXiv HTML read | source exists | cite as broad survey only |
| `ma2025saydo` | https://arxiv.org/html/2510.02204 | arXiv HTML snippet read | source exists; needs deeper read if cited | use only for terminology risk unless fully read |
| `slampai2026gamereasoningarena` | https://github.com/SLAMPAI/game_reasoning_arena | GitHub README read | repository exists | cite only as software/framework context unless an archival paper is identified |

## Remaining Citation Tasks

1. Initial normalized BibTeX now exists at `submission/references.bib`; final venue style, anonymization, and page/section alignment remain.
2. Decide whether `yang2025codeagents`, `ma2025saydo`, `he2026stratreasoner`, and `lin2026toolpoker` are central enough to require PDF downloads and page-level notes.
3. Add page/section pointers for every Related Work claim before submission.
4. Check final venue requirements for arXiv preprints, anonymous citations, and AI-use disclosure.
5. Do not cite `html_snippet_read` entries for major claims without upgrading read status.
