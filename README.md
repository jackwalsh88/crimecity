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
python3 scripts/bundle.py --output Crime-City-v0.1.html
```

## Implemented

- Five reels, three rows, twenty fixed left-to-right lines and the supplied symbol values.
- Random cosmetic variants, proportional symbol containment, separate portrait and landscape five-layer parallax.
- Within-round heat, gunfire upgrades, katana splits, conditional base wild expansion, sticky bonus wilds, additive multipliers and crossfire doubling.
- Three bonus tiers, scatter retriggers, a 40-awarded-spin ceiling and a total-round 15,000× cap.
- Free mission previews, recorded demo replay, social wording, sound synthesis, turbo, confirmed autoplay and adjustable demo amounts.
- Rendering separated from a deterministic event model; visual choices do not change outcomes.

## Source layout

| File | Purpose |
| --- | --- |
| `dist/index.html`, `style.css`, `app.js` | Responsive game presentation and demo controls |
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
