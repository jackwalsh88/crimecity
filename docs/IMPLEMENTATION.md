# Crime City v0.2 implementation notes

## Scope

A standalone HTML prototype, with no external fonts or runtime dependencies. This is not yet the Svelte/Pixi frontend or Python math-sdk publication package. Local pseudo-random outcomes are for development only. Production must consume server-authoritative outcome books.

## Asset audit

The archive contains **47 PNGs and one MP4**, not the 45 PNGs described in the handoff. The build maps 44 PNGs; it excludes the two flattened base backgrounds and the sticky frame with baked CAUTION text. The MP4 is retained in the original archive and is not needed for the five-layer parallax renderer.

Most dimensions differ substantially from the handoff. L1 is 1024×1536, H3 and several low symbols are not square, bullet impacts are not 256×256, and frames are approximately 1675×939. All ordinary symbols use proportional containment. Both available beam artworks are mapped as variants. The two textless sticky-frame variants are used; the CAUTION variant is excluded.

The provided 17.2% / 25.5% / 65.6% / 55.7% reel-window coordinates are used. The supplied cyan frame has a ragged partially opaque inner edge; the dark reel surface is layered above that inner edge so symbols remain legible. Portrait mode adjusts the frame presentation to preserve usable reel cells.

A code-rendered black grille patch masks the SS letters on the standalone landscape and portrait car layers. It follows each source canvas's cover transform. The source PNGs are not modified. This is a prototype presentation mask, not a representation of comprehensive IP clearance: car shape, other badges, film-inspired characters, phrases and the overall design still require review before commercial submission.

## Explicit interpretations of ambiguous rules

1. **Heat event order:** reveal, conditional/unconditional expansion, mandatory rampage slash, heat accrual and newly crossed thresholds, crossfire, final line evaluation, cap, bonus transition. Each distinct winning line and each newly landed wild cell contributes one heat point. The same line cannot repeatedly contribute on the same spin. Newly created winning lines can contribute in later upgrade phases.
2. **Threshold effects:** gunfire, threshold slash and guaranteed drop fire only when their thresholds are crossed. Rampage separately guarantees a slash on every free spin. Existing sticky wilds do not repeatedly grant heat. Base rounds start with no heat; bonus heat persists inside the current round.
3. **Clean Cut replaces splitting:** evaluate all twenty routes. On each route, identify the first unexpanded crew symbol from left to right, defaulting to H2 if no crew is present. Replace only low symbols along the route with that symbol. Reject candidates that reduce any pre-existing line award. Choose the greatest immediate total improvement, randomly breaking ties with the round RNG. If there are no eligible routes, emit a no-op cut. Crew, scatters, landed wilds and expanded wilds are protected. The resulting board uses normal line math, without a split factor.
4. **Wild eligibility:** base candidates are considered together, and only reels participating in a qualifying hypothetical expanded win are activated. In a bonus, all newly landed wilds expand. Scatter count is captured before new expansion; symbols hidden behind pre-existing sticky reels do not count.
5. **Line awards:** one highest-paying interpretation per line. Only expanded wilds inside the matched run modify that line. All-wild ties select a single result. Values multiply the total base amount, not one twentieth of it. Clean Cut changes symbols, not the win formula.
6. **Crossfire:** once per spin with two or more expanded reels; doubles current multipliers to at most 200 each. Updated sticky values persist during that bonus.
7. **Bonus entry:** 3 / 4 / 5+ badges trigger tiers 1 / 2 / 3. Bonuses award 10 / 12 / 12 spins. Retriggers award 4 / 6 / 8 spins, with 40 total awarded spins maximum. Five sticky reels complete the total round at exactly 15,000×, inclusive of previous wins.
8. **Unspecified feature prices:** no invented prices. The mission drawer provides clearly labeled free previews with a mission introduction and no balance effect. A fixed katana study demonstrates three low-symbol replacements creating a 40× middle-line award at 3★ heat, without other heat effects. Preview playback can be ended. Paid feature modes remain undesigned.
9. **Probabilities:** provisional symbol weights and uniform multiplier selection are exposed in `engine.js`. They are not calibrated or suitable for publishing. No RTP percentage is claimed.
10. **Replay:** deterministic local recorded events, with no debit or settlement. Production query-based server replay is not implemented. Live RGS launch parameters block demo play.

## Production work remaining

- Review Clean Cut selection and mission differentiation after the HTML demo is approved. Heat currently increments per distinct line, which is still a tuning decision.
- Design reel strips/weights, multiplier distributions, bonus frequencies, mode prices and target RTP. Run a statistically meaningful simulation and optimize outcome-book weights. Produce the actual math-sdk books, lookup tables and publication metadata; prove cap reachability and relevant tail risks.
- Implement server authentication, permitted amounts/currencies, play, end-round, interrupted-round recovery and server replay. A replay badge alone does not meet current replay requirements.
- Port presentation to the preferred production renderer as needed; assets can be reused. Serve production assets through the required Engine CDN.
- Complete localization and currency precision, full jurisdiction wording checks, required disclaimer, frame/device review and commercial art/IP review. This prototype does not claim Stake approval.
- Refine small-player layout and art readability. In the 400×225 layout, symbols are smaller than the brief's suggested 45–55 px because the supplied frame includes substantial ornamental margins.

## Official references checked 7 November 2026

- https://stake-engine.com/docs/approval-guidelines
- https://stake-engine.com/docs/approval-guidelines/front-end-communication
- https://stake-engine.com/docs/approval-guidelines/game-replay-requirements
- https://stake-engine.com/docs/rgs

The official guidelines require independent rounds, complete rules, visible balances/results, sound control, spacebar play, autoplay confirmation, responsive display and production replay. The published frontend must not generate authoritative financial outcomes locally.

