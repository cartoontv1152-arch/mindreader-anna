# MindReader release record

Identity: app ID `648`, slug `mindreader-game`, display name `MindReader`, initial candidate `1.0.0`. New separate checkout and repository; no existing Anna identity cache copied. The slug was checked absent before the dev harness created this new identity. Local identity checks pin ID 648.

Architecture: schema 3 static SPA, direct Host `llm.complete`, no storage or Executa. Secrets are not entered; only category and clue history are sent to AI. Runtime questions and guesses are never replaced with fixtures.

## Verified before upload

- `npm run check`: build, 15 Node tests, and strict schema validation passed (dispatcher 0.27.0).
- Dependency audit: zero vulnerabilities.
- Chrome Use extension connected to the Love profile and the intended Anna account `cartoontv1152_1689`.
- Real Host completions returned contextual questions during an Animals game. Nine answers were supplied through the UI, and all returned turns were valid. No fixture, provider key, or local fallback was used.
- Desktop 1000×760 and mobile 390×844 first-open views checked through Chrome Use. Start and category controls fit; mobile clue history is collapsed on first open. Harness mobile mode remounts the iframe and intentionally starts a new in-memory game.
- Source repository created separately: https://github.com/cartoontv1152-arch/mindreader-anna.

Remaining release gates: upload immutable version, install exact version and verify grants, complete a real game in Anna, capture genuine production screenshots, submit for review and independently verify the pinned candidate. Do not release publicly before approval.
