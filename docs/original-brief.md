# CRIME CITY — Stake Engine Prototype, Asset, Mechanics & Math Handoff (For ChatGPT Astra)

## 0. Instructions for ChatGPT Astra
You are receiving this specification along with a **`.zip` archive containing 45 finalized `.PNG` art assets** for **"CRIME CITY"**—a high-volatility **GTA V × Quentin Tarantino parody slot machine** designed for **Stake Engine (`stake-engine.com`)**.

**Your immediate workflow in Astra:**
1. **Unpack & Inspect the Attached `.zip` in Python:** Extract all 45 `.PNG` files in your Python sandbox, inspect their filenames, dimensions, and transparency, and map them to the **Asset Inventory & Random Variant Pools** in Section 2.
2. **Verify Frame & Aspect Ratio Nuances:**
   * The two `5×3` Reel Frames (`reel_frame_5x3_v1.png` and `v2.png`) are on a **`16:9` canvas** with a transparent center window spanning **`x: 17.2% to 82.8%`** (`width = 65.6%`) and **`y: 25.5% to 81.2%`** (`height = 55.7%`). Align the 5×3 reel grid to that exact inner cyan opening.
   * The two `L1` Cherry Milkshake symbols (`L1_v1.png`, `L1_v2.png`) have a **`2:3` portrait aspect ratio**—render them inside the square reel cells using proportional containment (`object-fit: contain`) so they never stretch horizontally.
   * On the standalone muscle car parallax cutout layers (`layer3_car`), mask out the tiny `"SS"` letters on the front black honeycomb grille so the prototype is 100% IP-compliant.
3. **Build the Playable Stake Engine Prototype:** Create a rock-solid, self-contained playable prototype (and downloadable `.html` bundle) implementing the **5-Layer Mouse Parallax**, **Random Duplicate Variant Pools**, **5-Star Wanted Heat Meter**, **All-Out Gimmicks**, **20-Payline Math Model**, and **Stake Engine UI/Social Mode Compliance** detailed below.

---

## 1. Stake Engine Platform Architecture & Compliance Context (`stake-engine.com`)

This prototype models a production game for **Stake Engine** (Stake.com & Stake.us’s Remote Gaming Server ecosystem, which pairs a **Python `math-sdk`** backend with a **Svelte 5 + PixiJS 8 `web-sdk`** frontend):

* **Strictly Stateless Math:** Every spin/round is resolved independently via pre-simulated outcome books (`.jsonl.zst`) and lookup tables (`.csv`). There are **no** progressive jackpots or cross-round persistence. However, **within a single spin or bonus round**, multi-stage cascades, symbol splits, bullet upgrades, and escalating heat meters are 100% supported as ordered JSON events.
* **Required Reviewer Viewports:** Must scale cleanly across:
  * **Laptop / Desktop:** `1024 × 576 px` (`16:9`)
  * **Popout L (Mini-Player Large):** `800 × 450 px` (`16:9`)
  * **Popout S (Mini-Player Small):** `400 × 225 px` (`16:9` — symbols render at ~45–55 px; scale Expanded Wild multiplier crests by `1.5×` below 800 px viewport width)
  * **Mobile Portrait:** `425 × 812 px` (`~9:16` — switches to the `9:16` mobile background layers)
* **Stake.us Social Mode (`social=true`) Compliance:**
  * Zero `$` dollar signs or paper bills are baked into the artwork (all loot is Gold Bullion, Diamonds, and the Glowing Briefcase).
  * When `social=true` is toggled, all UI and rules text dynamically swaps restricted gambling terms:
    * `Bet / Total Bet` $\rightarrow$ **`Play / Play Amount`**
    * `Payline / Paylines` $\rightarrow$ **`Win Line / Win Lines`**
    * `Paytable / Payout` $\rightarrow$ **`Win Table / Win`**
    * `$` Currency $\rightarrow$ **`XSC` / `XGC` tokens** (no `$` prefix)
    * Never use the words `Buy`, `Bonus Buy`, `Cash`, `Money`, `Credit`, or `Wager`.
* **Mandatory UI Controls:** Spin (`↻` + `Spacebar` shortcut), Bet/Play Adjusters (`−` / `+`), Balance Meter, Incremental Win Counter, Turbo Toggle (`⚡`), Autoplay (`🔁` with confirmation prompt), Feature Spin Drawer (with mandatory confirmation prompt for any mode costing `> 2×` base play), Sound Mute Toggle (`🔊` / `🔇`), Replay Badge (`isReplay` mode), and Info/Rules Modal (`ℹ`).

---

## 2. Complete 45-Asset Inventory & Random Variant Pools

Per the art direction rule (**"for duplicates, pick them randomly each time"**), every multi-variant asset is stored in an array pool and selected randomly (`pool[Math.floor(Math.random() * pool.length)]`) whenever that symbol or effect spawns:

### 2.1 Reel Symbols (`1:1` Square `512 × 512` Transparent PNGs; `L1` is `2:3` Portrait)
| Symbol ID | Asset / Pool Name | Variants in ZIP | Visual Description & Integration Notes |
| :--- | :--- | :---: | :--- |
| **`H1`** | `H1.png` *(The Pulp Hitman)* | `1` | Circular crimson, gold & cyan medallion. Hitman in black suit, skinny tie & gold aviators aiming a gold pistol. |
| **`H2`** | `H2.png` *(The Vengeance Bride)* | `1` | Circular canary-yellow, gold & cyan medallion. Blonde assassin in yellow leather moto-jacket holding a katana diagonally. |
| **`H3`** | `H3.png` *(The Vice Kingpin)* | `1` | Circular neon-magenta, gunmetal & cyan medallion. Kingpin in tropical palm shirt & gold Cuban chain holding a golden SMG. |
| **`H4`** | `H4.png` *(Getaway Muscle Car)* | `1` | Circular electric-blue, gold & cyan medallion. Cherry-red 1970 V8 muscle car with chrome supercharger blower (unbadged grille). |
| **`L1`** | **`POOL_L1`** *(Cherry Milkshake)* | **`2`** (`L1_v1`, `L1_v2`) | **Random Pool:** `2:3` portrait retro fountain glass with ruby strawberry swirl, whipped cream, cherry & straw (`v1` warm gold rim; `v2` cyan neon rim). Fit proportionally inside cell. |
| **`L2`** | **`POOL_L2`** *(Police Handcuffs)* | **`2`** (`L2_v1`, `L2_v2`) | **Random Pool:** Anodized sapphire-blue steel handcuffs with gold chain links (`v1` horizontal angled; `v2` vertical hanging with keyholes). |
| **`L3`** | **`POOL_L3`** *(Emerald Duffel Bag)* | **`3`** (`L3_v1`..`v3`) | **Random Pool:** Unzipped emerald-green leather heist duffel bag overflowing with solid gold bullion bars and giant cut green emeralds (zero `$` signs). |
| **`L4`** | `L4.png` *(Royale Cheeseburger)* | `1` | Diner cheeseburger with melted cheddar, neon purple wrapper band, retro triangle, and golden bullet-casing toothpick. |
| **`SCATTER`** | `SCATTER.png` + `scatter_text_plaque.png` | `1` + `1` | 3-Star gold police shield badge flanked by red & cyan siren domes on a steel pedestal. Overlay `scatter_text_plaque.png` (`"BONUS"`, `4:1` ratio) across the empty gold ribbon in the middle (`y ≈ 44%–62%`). |
| **`WILD` (1×1)** | `wild_base_1x1.png` + `wild_text_plaque.png` | `1` + `1` | Square gold/gunmetal art-deco frame with black briefcase bursting open with golden light & cyan sparks. Overlay `wild_text_plaque.png` (`"WILD"`, `4:1` ratio) over the empty bottom plaque band (`y ≈ 67%–85%`). |

---

### 2.2 Full-Reel `1:3` Expanding Briefcase Wild Suite & Gimmick VFX
| Asset / Pool ID | Variants in ZIP | Aspect Ratio | Layer Order & Placement Coordinates |
| :--- | :---: | :---: | :--- |
| **`POOL_WILD_BEAM`** | **`2`** (`v1`, `v2`) | `~1:2.67` (`576 × 1536`) | **Layer 1 (Back):** Full-reel vertical banner of the open briefcase at the base blasting a column of golden fire & cyan lightning up to the top socket (`v1` purple/orange fire; `v2` yellow/cyan lightning with built-in corner chains). |
| **`POOL_STICKY_FRAME`** | **`3`** (`v1`, `v2`, `v3`) | `~1:2.67` (`576 × 1536`) | **Layer 2 (Free Spins Sticky Lock):** Heavy gold chains, padlocks, and yellow straps around a transparent center. **Use the textless diagonal black-and-yellow hazard stripe variant (`v3`) as primary** to comply with Stake Engine’s no-baked-text rule. |
| **`wild_mult_crest_blank`** | `1` | `1:1` (`256 × 256`) | **Layer 3 (Top Socket):** Circular brushed-gunmetal, gold & cyan ring with a smooth dark center disc. Centered over the top socket (`x: 50%, y: 10.5%` of banner height). Stamp live multiplier text (`2X`–`200X`) in the center. |
| **`wild_text_plaque`** | `1` | `4:1` (`512 × 128`) | **Layer 4 (Bottom Plaque):** Brushed gunmetal & gold rivet plate reading `"WILD"`. Centered over the bottom plaque plate (`x: 50%, y: 88.8%` of banner height). |
| **`POOL_FX_BULLET`** | **`4`** (`v1`..`v4`) | `1:1` (`256 × 256`) | **Random Pool (4 variants):** Shattered gold bullet impact craters with glowing cyan energy cracks. Used by the **2-Star Gold 1911 Drive-By** gimmick with random `90°` rotation steps. |
| **`fx_katana_slash_beam`** | `1` | `4:1` (`1024 × 256`) | Horizontal razor-sharp yellow/white steel slash with cyan lightning sparks. Used by the **3-Star Bride’s Katana Split** gimmick. |

---

### 2.3 UI, Frames, Popups & 5-Layer Parallax Backgrounds
| Asset / Pool ID | Variants in ZIP | Aspect Ratio | Purpose & Coordinates |
| :--- | :---: | :---: | :--- |
| **`POOL_REEL_FRAME`** | **`2`** (`v1`, `v2`) | `16:9` | Gunmetal & gold art-deco 5×3 slot frame with **5 Gold Wanted Stars** on the top header (`v1` glowing cyan inner border; `v2` burnished gold inner border). **Inner transparent reel opening:** `x: 17.2% to 82.8%`, `y: 25.5% to 81.2%`. |
| **`game_logo_title`** | `1` | `16:9` | `"CRIME CITY"` 3D grindhouse logo over a purple/gunmetal `V` winged crest with two crossed gold 1911 pistols. |
| **`hero_bigwin_popup`** | `1` | `~2:3` | Full-body portrait of the Pulp Hitman in black suit & aviators holding the gold 1911 pistol and glowing golden briefcase. |
| **`win_banner_ribbon`** | `1` | `16:9` | Winged art-deco & chrome tailfin celebration ribbon with a dark empty center panel for live Big Win tier & payout text. |
| **Base Game 5-Layer Parallax (`16:9` Desktop)** | `5 layers` + `1 full` | `16:9` (`1920 × 1080`) | `Layer 0`: Sunset Sky & Wet Road (`opaque`) $\rightarrow$ `Layer 1`: Downtown Skyline & Mid Palms (`transparent PNG`) $\rightarrow$ `Layer 2`: Left Neon 1950s Diner (`transparent PNG`) $\rightarrow$ `Layer 3`: Right Red Muscle Car (`transparent PNG`) $\rightarrow$ `Layer 4`: Left/Right Foreground Framing Palms (`transparent PNG`). Shift layers horizontally by `[4px, 9px, 16px, 24px, 32px]` on mouse move. |
| **Base Game 5-Layer Parallax (`9:16` Mobile)** | `5 layers` + `1 full` | `9:16` (`1080 × 1920`) | Matching vertical mobile parallax layers (`Sky/Road` $\rightarrow$ `Skyline` $\rightarrow$ `Mid Palms` $\rightarrow$ `Muscle Car` $\rightarrow$ `Foreground Palm`). |
| **`bg_freegame` (Vault Bonus)** | `1` | `16:9` (`1920 × 1080`) | **Act II — The Reservoir Vault Job:** Symmetrical blown-open circular steel bank vault door, heaps of gold bars & diamonds on left/right, red laser tripwires. |
| **`bg_superbonus` (Chopper Chase)** | `2` (`16:9` & `9:16`) | `16:9` & `9:16` | **Act III — 5-Star Helicopter Highway Chase:** Nighttime multi-lane Los Santos freeway with twin black police helicopters shining cyan and crimson searchlights onto the center road. |

---

## 3. Game Mechanics & "All-Out Gimmicks" Specification

### 3.1 Core Grid & Payline Formula
* **Grid:** 5 Reels × 3 Rows (`20 Fixed Paylines / Win Lines`, paying consecutive left-to-right from Reel 1).
* **Line Win Formula:** All paytable values are multipliers of the **$1.0\times$ Base Play/Bet ($B$)**. For payline $k$ with matching symbol $S$ of length $n \in \{3, 4, 5\}$:

$$\text{LineWin}_k = B \times \text{Pay}(S, n) \times M_{\text{Wild}}(k) \times M_{\text{Split}}(k) \times M_{\text{Heat}}$$

Where:
* $M_{\text{Wild}}(k) = \sum_{c \in \text{Wilds}(k)} m_c$ (if 1+ Expanded Briefcase Wilds participate on line $k$, their multipliers **add together**; otherwise $1$).
* $M_{\text{Split}}(k) = 1 + 0.5 \times (\text{number of Katana-Split cells on line } k)$.
* $M_{\text{Heat}}$ is the active **Wanted Heat Global Multiplier** (`2×` at `1★–4★`, `5×` at `5★`, or `1×` at `0★`).

---

### 3.2 Gimmick 1: ⭐ The 5-Star Wanted Heat Meter (`1★` to `5★`)
The 5 Gold Stars on the top header of `reel_frame_5x3` track the current **Wanted Heat Level**. Every winning event or Briefcase Wild adds **+1 Wanted Star**, unlocking escalating Tarantino × GTA modifiers:
1. **⭐ 1-Star ("Street Heat"):** Activates a **`2×` Global Win Multiplier** ($M_{\text{Heat}} = 2$).
2. **⭐⭐ 2-Star ("Gold 1911 Drive-By"):** The Hitman fires **3 to 6 shots** onto random low-paying symbols (`L1–L4`), stamping each with a random bullet crater from **`POOL_FX_BULLET`** and upgrading those cells into high-paying **Heist Crew Medallions (`H1–H4`)** before win evaluation!
3. **⭐⭐⭐ 3-Star ("The Bride’s Katana Slash"):** Slices horizontally or diagonally across the reels with **`fx_katana_slash_beam`**, splitting every hit symbol into a **`2× SPLIT` or `3× SPLIT`** double/triple symbol!
4. **⭐⭐⭐⭐ 4-Star ("The Pulp Briefcase Drop"):** Drops 1 guaranteed **`1:3` Expanding Glowing Briefcase Wild (`10×–100×`)** onto a random reel.
5. **⭐⭐⭐⭐⭐ 5-Star ("SWAT Helicopter Spotlight — Maximum Heat"):** Upgrades the Global Heat Multiplier to **`5×`** ($M_{\text{Heat}} = 5$), multiplying on top of all Briefcase Wild and Katana Split multipliers!

---

### 3.3 Gimmick 2: 💼 Expanding Glowing Briefcase Wild (`1:3`) & "Mexican Standoff" Ricochet
* **Conditional Base Expansion / Unconditional Bonus Expansion:** In Base Game, a landed `1×1` Briefcase Wild expands into the `1:3` Full-Reel Banner (`POOL_WILD_BEAM`) if expansion forms part of a win (in Free Spins, it always expands and locks **Sticky** with `POOL_STICKY_FRAME`).
* **Multiplier Roll:** Upon expanding, the top circular crest (`wild_mult_crest_blank`) rolls through values and stamps a multiplier from:
  > **`2×` | `3×` | `4×` | `5×` | `10×` | `15×` | `20×` | `25×` | `50×` | `100×`**
* **🔫 The "Mexican Standoff" Ricochet Gimmick:** Whenever **2 or more Expanded Briefcase Wilds** are on the reels on the same spin, they trigger a **Mexican Standoff**! Crossfire ricochets bounce between the briefcases, **doubling (`×2`) every Briefcase multiplier on screen** (up to `200×` per reel!) before they add together on winning lines!

---

### 3.4 Gimmick 3: 🚁 Three Tiered Bonus Rounds & "MISSION PASSED! 15,000× MAX WIN"
Landing **3, 4, or 5 Police Siren Badge Scatters (`SCATTER`)** triggers one of three bonus tiers:
1. **3 Scatters $\rightarrow$ *"The Reservoir Vault Job"* (10 Free Spins on `bg_freegame`):**
   * All Expanded Briefcase Wilds lock **Sticky** for the rest of the bonus.
   * The **5-Star Wanted Heat Meter never resets** between Free Spins.
   * Re-triggers: `3/4/5 Scatters = +4 / +6 / +8 Free Spins` (up to 40 spins cap).
2. **4 Scatters $\rightarrow$ *"Kill Mode Rampage"* (12 Free Spins on `bg_freegame`):**
   * Starts immediately at **⭐⭐⭐ 3-Star Heat** (**Bride’s Katana Symbol Splits** guaranteed on every spin!) + Sticky Briefcase Wilds.
3. **5 Scatters $\rightarrow$ *"5-Star Helicopter Chase"* (12 Super Spins on `bg_superbonus`):**
   * Starts immediately at **⭐⭐⭐⭐⭐ 5-Star Heat** (`5×` Global Multiplier active from Spin 1).
   * Drops **1 guaranteed Sticky Expanded Briefcase Wild (`10×–100×`)** before Spin 1.
   * Low multipliers (`2×, 3×, 4×`) are removed from the pool, and **Mexican Standoff `×2` Ricochets** trigger on every spin with 2+ Briefcases!
4. **🏆 Full Crew Lock ("MISSION PASSED! RESPECT +" — Instant `15,000×` Cap):**
   * If Sticky Expanded Briefcase Wilds lock on **all 5 reels**, the round ends immediately, flashes the golden GTA-style **`MISSION PASSED! RESPECT +`** celebration screen, and awards the **`15,000×` Maximum Win**!

---

## 4. Mathematical Model & PAR Sheet (`math-sdk` Spec)

### 4.1 Symbol Payout Matrix (Multipliers of $1.0\times$ Base Bet)
| Symbol ID | Name | 3-of-a-Kind | 4-of-a-Kind | 5-of-a-Kind |
| :--- | :--- | :---: | :---: | :---: |
| **`WILD`** | Expanded Briefcase Wild *(Full Line)* | — | — | **`30.00×`** |
| **`H1`** | The Pulp Hitman (Crimson Medallion) | `3.00×` | `10.00×` | **`30.00×`** |
| **`H2`** | The Vengeance Bride (Yellow Medallion) | `2.00×` | `6.00×` | **`20.00×`** |
| **`H3`** | The Vice Kingpin (Magenta Medallion) | `1.50×` | `4.50×` | **`12.00×`** |
| **`H4`** | Getaway Muscle Car (Blue Medallion) | `1.00×` | `3.00×` | **`8.00×`** |
| **`L1`** | Diner Cherry Milkshake (Ruby Red) | `0.50×` | `1.20×` | **`3.50×`** |
| **`L2`** | Police Handcuffs (Sapphire Blue) | `0.40×` | `1.00×` | **`3.00×`** |
| **`L3`** | Emerald Heist Duffel Bag (Green) | `0.30×` | `0.80×` | **`2.50×`** |
| **`L4`** | Royale Cheeseburger (Amethyst Purple) | `0.20×` | `0.60×` | **`2.00×`** |

### 4.2 20 Fixed Paylines Map (Row `0` = Top, Row `1` = Middle, Row `2` = Bottom)
```text
Line 01: [1,1,1,1,1]  Line 06: [0,0,1,2,2]  Line 11: [1,0,1,2,1]  Line 16: [2,1,2,1,2]
Line 02: [0,0,0,0,0]  Line 07: [2,2,1,0,0]  Line 12: [1,2,1,0,1]  Line 17: [1,0,0,0,1]
Line 03: [2,2,2,2,2]  Line 08: [1,2,2,2,1]  Line 13: [0,1,1,1,0]  Line 18: [0,2,0,2,0]
Line 04: [0,1,2,1,0]  Line 09: [0,0,1,0,0]  Line 14: [2,1,1,1,2]  Line 19: [2,0,2,0,2]
Line 05: [2,1,0,1,2]  Line 10: [2,2,1,2,2]  Line 15: [0,1,0,1,0]  Line 20: [0,2,2,2,0]