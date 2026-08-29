# DreamPulse Premium Web3 UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax.

**Goal:** Apply the approved premium rounded Web3 Design DNA to every DreamPulse section without changing trading behavior.

**Architecture:** Keep React behavior intact and make the smallest semantic markup adjustments needed for section shells. Implement the visual identity entirely with existing CSS and native motion.

**Tech Stack:** Next.js 16, React 19, TypeScript, vanilla CSS.

---

### Task 1: Apply section-wide structure and Design DNA

**Files:** `app/page.tsx`, `app/agents/page.tsx`, `components/prediction-room.tsx`, `components/pulse-rail.tsx`, `components/agent-console.tsx`, `app/globals.css`

- [ ] Update header, hero, telemetry, market, odds, supporting panels, position, proof, loading/error, agents, and footer shells.
- [ ] Replace sharp terminal styling with measured charcoal surfaces, 12/18/24 px radii, soft borders, and restrained semantic color.
- [ ] Preserve all interaction handlers and API calls.
- [ ] Add premium native transitions and reduced-motion fallbacks.
- [ ] Run `npm test`, `npm run typecheck`, `npm run build`, and `git diff --check`.

### Task 2: Visual verification

- [ ] Verify `/` and `/agents` at desktop and 390 px.
- [ ] Verify no horizontal overflow, controls at least 44 px, visible focus, and reduced motion.
- [ ] Compare screenshots against the approved DNA and correct concrete visual defects.
- [ ] Commit as `feat: apply premium web3 design system`.
