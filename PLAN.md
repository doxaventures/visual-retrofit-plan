# Visual Retrofit Campaign Plan

Goal: every article/blog in `B2BAdvisor` must have at least 3 visual blocks, and the first block must be `lead-infographic`, following the [infographic-visual-blocks](https://github.com/doxaventures/infographic-visual-blocks) system.

## Phase 1 — Inventory ✅

Ran `scripts/inventory.cjs` over `data/articles/*.ts`, `data/blog/*.ts`, and `data/guides/*.ts`.

**Result:** 749 articles analyzed.

| Archetype | Count | Priority |
|---|---|---|
| B-ToolComparison | 306 | high |
| D-IntegrationStack | 153 | high |
| A-CostBreakdown | 129 | high |
| C-SprawlDiagnostic | 104 | high |
| X-CrossCutting | 57 | high |

**Priority rules:**
- `high` = no `lead-infographic`
- `medium` = has `lead-infographic` but fewer than 3 visual blocks
- `low` = already has lead + ≥3 visual blocks

## Phase 2 — Pilot retrofit

Select 15 representative articles (2-3 per archetype). For each:

1. Read existing blocks and extract key numbers.
2. Insert the archetype template from `infographic-visual-blocks`.
3. Run `npx tsc --noEmit`.
4. Start dev server, `webfetch` the page, verify block order/rendering.
5. Fix issues until clean.
6. Commit each archetype batch.

**Pilot set:** see `pilot-set.json`

## Phase 3 — Tooling

Build helper scripts in the target repo under `scripts/visual-retrofit/`:

- `verify-blocks.ts` — assert first block is `lead-infographic` and ≥3 visuals per article
- `generate-blocks.ts` — read article text, suggest visual-block array using LLM/extraction rules
- `render-check.ts` — start dev server, sample pages, report missing blocks

## Phase 4 — Wave rollout

Parallelize by archetype, using subagents when possible.

| Wave | Archetype | Articles | Approx. effort |
|---|---|---|---|
| 1 | B-ToolComparison | 306 | 1.5 weeks |
| 2 | D-IntegrationStack | 153 | 1 week |
| 3 | A-CostBreakdown | 129 | 1 week |
| 4 | C-SprawlDiagnostic | 104 | 4-5 days |
| 5 | X-CrossCutting | 57 | 3-4 days |

Each wave must:
- Follow the archetype-specific template
- Run `npx tsc --noEmit`
- Render-check a 10% sample
- Commit as a wave PR/batch

## Phase 5 — QA & proofread

Per article:
1. Confirm `blocks[0].type === "lead-infographic"`
2. Count visual blocks ≥ 3
3. Verify all `illustration` names exist in registry
4. Verify `comparison-table` headers/cells dimensions match
5. `webfetch` page, check captions and block order
6. Fix until clean

## Phase 6 — Final integration

1. Final `npx tsc --noEmit`
2. Spot-check 20 random pages
3. Merge all wave commits
4. Update campaign status in this repo

## Estimated timeline

| Phase | Effort |
|---|---|
| Inventory | done |
| Pilot | 2-3 days |
| Tooling | 2 days |
| Wave rollout | 4-5 weeks |
| QA | 1 week |
| **Total** | **~6-8 weeks** |

## Definition of done

- 749 articles have `lead-infographic` as first block
- Every article has ≥3 visual blocks
- `tsc --noEmit` passes
- 10% render sample is clean
