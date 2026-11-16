# Game Base — repository instructions

- Work only in this repository. Never modify sibling projects, commit, push or deploy without an explicit request.
- Communicate in Russian; English code and identifiers are appropriate.
- Read README.md, docs/ARCHITECTURE.md and docs/PROGRESS.md. Record important decisions in docs/DECISIONS.md.
- Preserve default mechanics, artwork, audio, keyboard, touch and gamepad controls. No unsolicited rebalancing or artwork generation.
- Phaser owns gameplay/timing; Vue owns UI. Use instance bridges with bounded snapshots.
- Content belongs in GameDefinition and asset packs. Reuse dedicated ability and AI behaviors.
- Preserve seeded simulation, pools, entity budgets and explicit teardown/restart cleanup.
- Keep the Vue entry SSR-safe and CSS inside .game-base. Integrations belong behind GamePlatformAdapter.
- No Laravel, PHP, databases, sign-in, payments, ads or online rankings in v1. Client results are untrusted.
- Run relevant tests after meaningful edits, then npm run check and npm run test:e2e. Never disable checks or suppress errors.
- Verify Canvas output with actual screenshots. Update docs/PROGRESS.md with evidence and limitations.
- Never request admin rights, credentials or payments, alter system settings or invoke --yolo.
- After three failures of the same approach, diagnose and choose another approach or record a blocker.
