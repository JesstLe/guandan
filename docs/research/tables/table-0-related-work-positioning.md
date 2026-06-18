# Table 0: Related-Work Positioning

This table is a paper-ready compact version of `notes/related_work_comparison.md`.

| Work | Setting | Communication | Reasoning Signal | Verifier / Metric Grounding | Dynamic Legal Actions |
| --- | --- | --- | --- | --- | --- |
| LLM-Coordination | coordination games | varies | coordination/ToM reasoning | LLM verification + scores | no |
| Hanabi LLM agents | fully cooperative Hanabi | game-defined clues | reasoning traces + utilities | game scoring + annotations | game-specific |
| M3-BENCH | mixed-motive games | mixed | BTA/RPA/CCA processes | process metrics | no Guandan-style verifier |
| ToM-Guandan | Guandan | zero explicit communication | ToM planning + performance | action recommender + scores | yes |
| OpenGuanDan | Guandan benchmark | agent API | agent performance | simulator metrics | yes |
| Strat-Reasoner | multi-agent games | game interaction | reasoning trace + action | RL reward + CoT comparison | not Guandan-specific |
| ToolPoker | poker | opponent modeling | reasoning traces | solver / reasoning metrics | poker actions |
| This project | Guandan decision points | zero explicit communication | structured LLM trace labels | rule-grounded verifier | yes |
