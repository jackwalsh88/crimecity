# Crime City

A playable neon crime-cinema slot prototype built from the supplied Crime City artwork and design brief. Intended as a presentation and mechanics foundation for a future Stake Engine implementation.

**Status: prototype, not a production gambling game.** Demo tokens only. There is no RGS wallet connection, approved math package, calibrated RTP or real-money feature entry. The demonstration probabilities are intentionally provisional.

## Run

No package installation or build is needed. Open `dist/index.html`, or serve the directory:

```sh
python3 -m http.server 8080 --directory dist
```

Run the mechanics checks with Node:

```sh
node --test tests/engine.test.cjs
```

Create a single-file offline HTML version:

```sh
python3 scripts/bundle.py --output Crime-City-v0.5.html
```

## Implemented

- Five reels, three rows, twenty fixed left-to-right lines and the supplied symbol values.
- Random cosmetic variants, proportional symbol containment, separate portrait and landscape five-layer parallax.
- Within-round heat, gunfire upgrades, **Clean Cut** katana transformations, conditional base wild expansion, sticky bonus wilds, additive multipliers and crossfire doubling.
- Three bonus tiers, scatter retriggers, a 40-awarded-spin ceiling and a total-round 15,000× cap.
- Free mission previews, recorded demo replay, social wording, sound synthesis, turbo, confirmed autoplay and adjustable demo amounts.
- Rendering separated from a deterministic event model; visual choices do not change outcomes.

## v0.5: Rendering rewrite

The reel animation now uses one clipped canvas and pre-rendered symbol sprites, drawing at most four visible symbols per moving column. It no longer constructs or blurs long DOM strips. The 15 settled cells and sticky-wild nodes are retained between events. The math is unchanged.

Five parallax layers use compositor animations instead of per-frame JavaScript style changes. Canvas particles reuse pre-baked glow sprites; the particle surface is cleared only while active. Reels, particles and amount counters share one on-demand frame loop. The game stops scheduling JavaScript animation frames at idle unless the diagnostic display is open. Ancestor filters, live strip blur and full-screen backdrop blur were removed. Sound, staggered stops, bounce, katana, missions, replay and Bowlby One SC remain.

Press **F8** to show requestAnimationFrame cadence and p95 frame interval on your device. A 60 Hz display should generally show about 60 FPS and 16.7 ms intervals. Remote-browser frame throttling makes that environment unsuitable for certifying local hardware performance. See `docs/PERFORMANCE.md` for validation and reproducible checks.

## v0.4: Typography

Bowlby One SC now styles the headings, controls, amounts and win displays. Small explanatory text keeps a plain sans-serif face. The original font and SIL OFL license are included under `dist/fonts`; the portable HTML embeds both and makes no Google Fonts requests. Number sizes adapt to their available width. Math, reels and parallax are unchanged.

## v0.3: Presentation

The mechanics are unchanged from v0.2. Actual scrolling symbol strips replace the old symbol-bobbing animation: each reel accelerates, brakes and settles separately, while sticky reels remain locked. Normal and turbo playback use the same resolved events.

The five supplied city layers now move at visibly different depths using an automatic camera sweep plus pointer response. Foreground travel is much stronger, including on portrait screens. Cabinet lighting, reel-stop sounds, gold/cyan particles, star ignition, wild-reel entrances and the supplied win ribbon accompany the existing outcomes. Reduced-motion preferences disable the camera and reel travel. Sound can be muted during an effect.

## Clean Cut

The katana traces one of the twenty lines and changes low symbols on its route into a single matching crew symbol. Existing crew, badges and briefcases remain intact. It chooses the strongest available improvement without reducing any existing line award, then evaluates the changed board normally. There is no extra split multiplier.

Use **Watch Clean Cut** for a short, fixed demonstration; use **The Missions** to explore free bonus previews. An **End Preview** control exits a preview without touching the balance.

| Mission | Starting conditions | Character |
| --- | --- | --- |
| The Vault Job | 10 spins, sticky briefcases | Build a locked collection in the vault |
| Neon Rampage | 12 spins, at least 3★ heat, Clean Cut each spin | Recruit matching crew across the neon strip |
| Midnight Pursuit | 12 spins, 5★ heat, one guaranteed sticky briefcase | Begin the helicopter chase at maximum heat |

All three retain within-mission heat and sticky briefcases. These are small variations for design review; probabilities and rewards remain provisional. The fixed katana study isolates that feature and is not a frequency sample.

## Source layout

| File | Purpose |
| --- | --- |
| `dist/index.html`, `style.css`, `app.js` | Responsive game presentation and demo controls |
| `dist/presentation.js`, `presentation.css` | Reel animation, parallax, cabinet effects and synthesized audio |
| `dist/engine.js` | Deterministic provisional mechanics and round events |
| `dist/assets/`, `assets.js` | Optimized artwork and variant pools |
| `asset-inventory.json` | Source filenames, dimensions, transparency and mapping |
| `tests/engine.test.cjs` | Independent rule examples and round invariants |
| `docs/IMPLEMENTATION.md` | Resolved ambiguities and production work remaining |
| `docs/original-brief.md` | Original project handoff, retained for reference |
| `prepare_assets.py` | Optional artwork optimization from the original archive |

## Demo modes

- `?social=true` uses social wording and XSC; add `currency=XGC` for XGC labels.
- `?replay=true` or `?isReplay=true` plays the most recently stored **local demo** round, if available. It cannot enter normal play.
- A launch containing `rgs_url` or `sessionID` is deliberately blocked from starting demo rounds. This prevents a prototype from silently impersonating a live server session.
- The Missions drawer previews bonus rounds for free. Its results never alter the demo balance.

See [implementation notes](docs/IMPLEMENTATION.md) before porting this to a production engine. Artwork was supplied by the project owner; no broader intellectual-property clearance is asserted.

