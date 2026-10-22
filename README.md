# MindReader

A direct-start, single-page Anna AI game. Think of one specific animal, everyday object, food, or fictional character; answer Yes, No, Sometimes, or Don't know. AI gets up to 20 questions and one final guess. You decide whether it guessed correctly.

## Development

Requires Node 22+ and the Anna CLI. Install with `npm ci`, then `npm run check`. Sign in to Anna CLI using your own account and run `npm run dev`. Open http://localhost:5230 for the real Host LLM harness. `npm run preview` serves the honest UI-only preview at http://127.0.0.1:5232; real play requires Anna.

## Design and behavior

- No landing page, user signup, free-text secret entry, or sidebar navigation.
- Category and one Start button; four answer buttons, undo, clue history, one final-guess confirmation, and replay.
- Every question and guess uses Host `llm.complete`. No provider keys, remote assets, custom server, Agent, or Executa.
- The prompt sees only the selected category and answered clues. The secret is never collected.
- The app enforces 20 questions, at least four answered questions before a guess, no repeated question text, and one final guess. A wrong guess is a player win.
- Failed calls don't consume questions. One automatic malformed-output repair; at most three user attempts per turn. New Game invalidates late responses. Pending calls cannot be submitted twice.
- No app storage or analytics. Games exist only in memory; closing or reloading starts fresh. Normal Anna AI quota applies.
- Locally bundled Geist and Phosphor icons; light/dark theme, keyboard focus, reduced motion, and narrow-screen layout.

## Release

Separate app slug `mindreader-game`, separate repository. Follow the current [Build on Anna 101](https://forum.anna.partners/t/build-on-anna-101/228): validate/build/test, upload immutable version, install and test that version, sync genuine listing screenshots, submit for review, verify pinned candidate. Review submission does not mean public release.

See [PRIVACY.md](PRIVACY.md) and [DEPLOY.md](DEPLOY.md).
