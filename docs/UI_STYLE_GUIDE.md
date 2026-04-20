# IlmoraX UI Style Guide

Compact rulebook derived from [src/routes/tryout.$id.tsx](../src/routes/tryout.$id.tsx) (Preparation + Countdown screens). Apply these rules to align Dashboard, Tryout List, CBT Active, Results, Review, Evaluation, Leaderboard, and Profile screens with the same quality bar.

---

## 1. WHY THE PREPARATION SCREEN WORKS

Five design decisions carry the screen. Any page missing 3+ of these will feel cheap:

| Pattern | Implementation |
|---|---|
| **Ambient radial header** | `radial-gradient(1200px 400px at 20% -10%, ${color}22, transparent 60%), radial-gradient(900px 500px at 90% -20%, ${color}18, transparent 70%), var(--color-bg)` — not a flat color bar. |
| **Single-hue color thread** | One accent (`tryout.color`) echoed across: header glow, pill dot/border/bg, icon tile, confirm-dialog icon square. The whole screen breathes in one color. |
| **Micro-label kicker** | `text-[11px] font-semibold uppercase tracking-wide text-stone-400` placed *above* or adjacent to the H1 — never as a loud pill badge. |
| **Measured typography** | H1 `text-[28px] leading-tight font-bold max-w-[22ch]` · description `text-[14px] leading-relaxed text-stone-500 max-w-[34ch]`. `ch` units force tasteful line wraps. |
| **Negative-margin overlap** | Next section uses `-mt-4` so stat cards cross the gradient-to-bg seam. Creates editorial depth instead of stacked flat bands. |

---

## 2. GLOBAL RULES (apply to every page)

### 2.1 Emoji discipline
- Inline emojis in body copy, H1s, or buttons are **banned**. `"📚 Mulai Tryout"` → `"Mulai Tryout"` with optional icon-tile to the left.
- Emojis only survive inside **icon tiles**: `w-9 h-9 rounded-xl` or `w-14 h-14 rounded-2xl` with tinted bg `${accent}18` and color `${accent}`.
- Loading state is not `🔄` — see Rule 4.

### 2.2 Color thread
- Pick **one accent per screen** (module color, status color, or `--color-primary`). Thread it through: header glow → kicker pill → icon tile → primary CTA border-bottom.
- Secondary accents live only inside bento StatCards — one per cell, never repeated across unrelated sections.
- Ban multi-gradient celebratory backgrounds like `bg-gradient-to-r from-amber-50 to-amber-100` for generic cards. Gradients are for the ambient header, not card fills.

### 2.3 Heading hierarchy
- H1 (page title): `text-[28px] leading-tight font-bold tracking-tight max-w-[22ch]`.
- H2 (section): `text-xl font-bold` — no emoji prefix. Use the divider pattern (Rule 2.5) for top-level sections.
- H3 (card title): `text-base font-extrabold`.
- Kicker above any H1/H2: `text-[11px] font-semibold uppercase tracking-wide text-stone-400`.

### 2.4 Typography line rule
- Any heading wider than 3 lines on a 480px shell is a failure. Use `max-w-[22ch]` / `max-w-[28ch]` / `max-w-[34ch]` to pin wraps.
- Body copy wider than 2 lines without `max-w-[Nch]` is a failure.

### 2.5 Section divider pattern
Instead of bare `<h3>🚀 Segera Hadir</h3>`, use:

```tsx
<div className="flex items-center gap-2 mb-3">
  <span className="text-[13px] font-semibold uppercase tracking-wide text-stone-500">
    Segera Hadir
  </span>
  <div className="flex-1 h-px bg-stone-200" />
</div>
```

### 2.6 Card surface formula
Every elevated card uses the same recipe:
```
bg-white rounded-[var(--radius-lg)] p-5 shadow-sm
border-2 border-stone-100 border-b-4 border-b-stone-200
```
For interactive cards, use the `.card` class. Do **not** invent alternative shadow stacks per card.

### 2.7 Pill/tag formula (category, status)
```tsx
<span
  className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide px-3 py-1.5 rounded-full border-2"
  style={{ color: accent, borderColor: `${accent}33`, background: `${accent}10` }}
>
  <span className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} />
  {label}
</span>
```
The brand dot is non-negotiable — it's what separates this pill from a generic badge.

### 2.8 Button text
- Dark bg → white text. Light bg → `text-stone-800`. Never `text-white` on `bg-white`.
- Drop emoji prefixes. `"📚 Mulai Tryout"` → `"Mulai Tryout"`.
- Keep border-bottom-width dynamic (4px rest → 2px active) via the existing `.btn` class — don't override it.

---

## 3. PAGE-SPECIFIC ALIGNMENT

### 3.1 Dashboard ([src/routes/dashboard.tsx](../src/routes/dashboard.tsx))
Current failures → fixes:
- Greeting card has `🧪` emoji at `opacity-10 rotate-[15deg]` — **keep** (works as texture), but move `👋` off the H2 text.
- `"📚 Mulai Tryout"` button → `"Mulai Tryout"` with separate icon tile, or drop the icon entirely.
- Three stat cards use `📝 🎯 📊` inline — replace with icon tiles: `w-9 h-9 rounded-xl bg-teal-100 text-teal-600`, `bg-amber-100 text-amber-600`, `bg-sky-100 text-sky-600`. Mirror the `StatCard` component from the preparation screen.
- `<h3>📚 Try-out Tersedia</h3>` → divider pattern (Rule 2.5), title `Try-out Tersedia`.
- Amber Evaluation card uses `bg-gradient-to-r from-amber-50 to-amber-100` — replace with solid `bg-amber-50 border-2 border-amber-200` (mirror the premium callout on preparation screen).
- `<h3>🚀 Segera Hadir</h3>` → kicker + divider. Grid cards drop the emoji-in-card pattern and adopt icon tiles.

### 3.2 Tryout List ([src/routes/tryout.tsx](../src/routes/tryout.tsx))
Close, but missing atmosphere:
- Add an ambient radial header behind the H2 + subtitle, seeded from `--color-primary`:
  ```tsx
  <div
    className="relative overflow-hidden pb-6"
    style={{ background: `radial-gradient(1000px 300px at 15% -20%, #14b8a622, transparent 60%), var(--color-bg)` }}
  >
  ```
- H2 needs a kicker above it: `Modul Tryout` (uppercase stone-400), then H1-size title.
- Filter pills are fine — already match the pattern.
- Card title `text-[13.5px] font-bold` not `text-sm font-extrabold` — the preparation screen uses tighter weights.
- Cards inherit `border-b-4 border-b-stone-200` via the surface formula — verify they match.

### 3.3 CBT Active (question screen in [src/routes/tryout.$id.tsx](../src/routes/tryout.$id.tsx))
- `🚩` and `⚠️` as raw button children → swap for `phosphor` / `lucide` icon components (Flag, AlertTriangle) sized `w-5 h-5`. If icons aren't installed, use inline SVGs. Raw emoji inside buttons looks amateur.
- Submit dialog `<div className="text-[48px] text-center mb-2">🚀</div>` → replace with a tinted icon tile (Rule 1): `w-14 h-14 rounded-2xl bg-teal-100 text-teal-600` containing a Rocket icon or the tryout color icon. Mirror the confirm-dialog icon from the preparation screen.
- Report dialog `🚨` in H3 → remove; the H3 "Laporkan Soal" stands alone with a coral icon tile above it.
- Option buttons: selected state already uses `bg-teal-50 border-primary` — good. Keep.
- Question card H2 `text-xl font-bold leading-relaxed` — fine. Add `max-w-[30ch]` to force wraps on desktop widths.
- Timer pill `⏱ {timeDisplay}` → replace `⏱` with a Clock icon component or drop it; keep only the monospace time.

### 3.4 Loading states (anywhere)
Current `<div className="text-3xl mb-3">🔄</div>` is a failure. Replace with a miniature `CountdownOverlay`-style treatment:
- Dark neutral backdrop (`bg-stone-50` for inline, `bg-stone-900` for full-screen).
- Radial gradient accent.
- Dot-grid texture (`backgroundImage: "radial-gradient(rgba(0,0,0,0.04) 1px, transparent 1px)", backgroundSize: "18px 18px"`).
- An animated element — ring with conic-gradient blur halo, or a shimmer bar — not a spinning emoji.
- Kicker text `text-[11px] uppercase tracking-[0.28em] text-stone-400` reading "Memuat".

### 3.5 Dialogs (global)
The confirm-start dialog in the preparation screen is the template:
1. Icon tile (`w-14 h-14 rounded-2xl` color-tinted square) top-center.
2. H3 `text-xl font-bold tracking-tight` centered.
3. Description `text-sm text-stone-500 leading-relaxed font-medium` centered, `max-w-[28ch] mx-auto`.
4. Optional MiniStat row (3-cell grid, `bg-stone-50`, `border-2 border-stone-100`).
5. Two CTAs: `btn-white` + `btn-primary`, `flex gap-3`, both `flex-1`.

Any dialog using `🚀` or `🚨` at 48px font-size breaks the pattern.

---

## 4. THE FIVE QUESTIONS BEFORE COMMITTING A SCREEN

Run this checklist before declaring a page done. Fail any one → revise.

1. **Is there a single color thread?** (one accent across header glow, kicker pill, icon tile, CTA)
2. **Is the hero a flat band or does it have ambient radial depth?** (should be the latter)
3. **Are emojis confined to icon tiles?** (no emojis inside H1/H2/button text/body copy)
4. **Does every heading have a `max-w-[Nch]` sibling or class?** (wraps are deliberate, not accidental)
5. **Do all cards use the single surface formula?** (`bg-white rounded-[--radius-lg] p-5 shadow-sm border-2 border-stone-100 border-b-4 border-b-stone-200`)

---

## 5. ASSET REFERENCES

- Tokens: [src/styles/app.css](../src/styles/app.css) (colors, radii, fonts, `.btn`, `.card`, `.dialog-*`).
- Reference screen source: [src/routes/tryout.$id.tsx](../src/routes/tryout.$id.tsx#L346-L589) (Preparation + Countdown components).
- StatCard component pattern: [src/routes/tryout.$id.tsx:528](../src/routes/tryout.$id.tsx#L528).
- MiniStat component pattern: [src/routes/tryout.$id.tsx:577](../src/routes/tryout.$id.tsx#L577).
- RuleItem (checklist row) pattern: [src/routes/tryout.$id.tsx:564](../src/routes/tryout.$id.tsx#L564).
- Countdown overlay + `countdownPop` keyframe: [src/routes/tryout.$id.tsx:590-652](../src/routes/tryout.$id.tsx#L590-L652).

When in doubt, open the preparation screen side-by-side with the screen you're editing and match the spacing rhythm, not just the tokens.
