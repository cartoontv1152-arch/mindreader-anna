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

## Uploaded and installed, 2026-10-22

- Uploaded immutable `1.0.0`, version ID `1555`, app ID `648`.
- Bundle ready: 7 files, 67,224 bytes; content hash `9d7ae3c19f9ef0b439e5ebb96e405eabb3354cf46fdbbf4fd7a096f9ed147cdc`. No frozen Executas, intentionally.
- CLI Windows dry-run hit the known libuv shutdown assertion; the real upload completed with exit code 0 and the expected identity.
- Developer Console installation toast confirmed MindReader v1.0.0. Independent grants read confirmed `installed_version: 1.0.0`, `llm.complete: true`, `satisfied: true`, and `missing: []`. The manifest requests no storage or agent capabilities.
- First app launch stalled at an empty browser document. Normal dashboard reload recovered it; no app code or permissions were altered. The installed game then connected and returned real AI questions.
- Production Undo restored the exact previous question and decreased the clue count, with no loading state or model call.
- Genuine installed ready screenshot captured and cropped to app content, excluding account details and host dock.
- Installed Food round completed with 8 answered clues, AI's final guess `cherry`, and the `You stumped me` result after an incorrect-guess confirmation. The user also interacted during this live test. Replay was observed starting a new Food game at Question 1 with zero clues. These were real production UI states, not test fixtures. The result was observed in AX text; the next screenshot captured the already-started replay and is labelled accordingly.
- Installed question screenshot shows all four answer buttons, the question count, clue history, and Undo fitting the default app window. Two genuine installed screenshots are used for the listing.
- Chrome responsive checks covered 390px mobile first-open behavior; dark-theme/error-state contrast was visually checked with a temporary Chrome media emulation, then restored. No browser preference changes were left in place.
