# Crime City v0.5 rendering work

## Findings

The supplied Journey/Odyssey reference draws its reels on a single canvas. Crime City's previous renderer created five long DOM strips (140 symbol images plus special-symbol plaques in the measured fixture), animated a blur across them, and filtered their entire machine ancestor. The particle canvas was cleared on every idle animation frame, and each resolved event rebuilt all 15 symbol cells and all expanded wilds.

## Changes

- One reel-window canvas, with at most four visible sprites per moving reel (20 total); no moving DOM images and no live blur. The settled symbols remain accessible HTML images.
- Original artwork is decoded once. Symbol tiles and small particle-glow tiles are rendered into reusable canvases before the first spin. Resize rebuilds only the size-dependent tiles.
- Reel backing resolution is capped at 1.5 device pixels per CSS pixel and approximately 1,100 pixels wide. Particle resolution is capped at 1.25. Text stays native browser text.
- All 15 settled cells and existing sticky-wild columns retain their node identities. Updates change symbols, labels and multiplier text in place.
- Reels, particles and count-ups share an on-demand requestAnimationFrame loop. The loop stops when those effects finish. A clean particle surface is not repeatedly cleared at idle.
- Five background layers retain different travel depths, using transform-only Web Animations rather than per-frame JavaScript style writes. Pointer response is coalesced. Hidden tabs pause camera animations and the frame loop.
- Removed machine-wide drop shadows, animated strip blur, per-particle live shadow blur, backdrop blur and animated SVG rim filters. Retained neon borders, star pops, bounce, particles, katana, count-ups and the existing artwork. Particle count is bounded at 120.
- F8 toggles an opt-in local FPS / p95 frame-interval display. This measures animation callback cadence, not a GPU trace or display presentation guarantee.

The deterministic engine is byte-for-byte unchanged: SHA-256 `72eecf2cb27b5b84d9726ffd1934f32f101b736b61ea5e070d5b49d9d1de9f7e`.

## Validation

18 existing engine checks passed. Browser regression checks cover retained cells, one bounded canvas, no moving image elements, cancellation, settled board equality, unchanged event data, sticky reels, multiplier updates, all-locked completion, resize during animation, count precision and win dismissal (15 checks).

The remote browser used for QA delivered recurring ~1,016 ms animation-frame intervals to both Crime City and Journey, even while reporting the page visible. Those runs are invalid for certifying 60 fps or claiming a speedup ratio. No local-device 60 fps result is claimed. The actual target is a steady ~16.7 ms cadence on a 60 Hz display; verify with F8 in the downloaded HTML on the target device. Browser power-saving modes and screen refresh rate affect this reading.

## Reproduce

1. Build a self-contained demo with `python3 scripts/bundle.py --output Crime-City-v0.5.html`.
2. Open it locally, wait for loading to complete, press F8 and exercise normal spins, turbo, Clean Cut and the three missions. Include portrait and landscape resizing. Hide F8 for final subjective smoothness checks.
3. For browser regressions, copy the bundled HTML into a temporary served directory, copy `tests/renderer-browser.js` beside it, and insert `<script src="renderer-browser.js"></script>` just before the closing body tag. After loading, click **Run renderer checks**. This fixture bypasses normal play controls for testing and must never be distributed as the game.
4. `tests/render-benchmark.js` can be injected in the same way for an idle / six seeded reel animations / effects timing sample. Keep the same viewport and browser settings for comparisons, keep the tab foreground, and do not modify files while recording (the development preview may reload).

Reference: [MDN canvas optimization guidance](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas), specifically cached primitives and avoiding per-frame shadow blur.
