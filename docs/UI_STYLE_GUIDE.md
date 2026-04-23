# IlmoraX UI Style Guide

Compact rulebook derived from [src/routes/tryout.$id.tsx](../src/routes/tryout.$id.tsx) (Preparation + Countdown screens), then refined through the Dashboard and Tryout List prototypes. Apply these rules to align Dashboard, Tryout List, CBT Active, Results, Review, Evaluation, Leaderboard, and Profile screens with the same quality bar.

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
- Prefer inline SVG icons inside **icon tiles**: `w-9 h-9 rounded-xl` or `w-14 h-14 rounded-2xl` with tinted bg `${accent}18` and color `${accent}`.
- Legacy emoji data may exist in mocks, but production-facing page chrome should render SVG icons or initials instead.
- **Profile avatar exception:** profile picture display and the profile avatar picker may use emoji avatars because they are user identity content, not page chrome. Keep them inside avatar surfaces only: circular profile identity avatar or square picker buttons. Do not use those emojis as heading prefixes, section labels, button prefixes, badges, empty-state decoration, or body-copy decoration.
- Loading state is not `🔄` — see Rule 4.

### 2.2 Color thread
- Pick **one accent per screen** (module color, status color, or `--color-primary`). Thread it through: header glow → kicker pill → icon tile → primary CTA border-bottom.
- Secondary accents live only inside bento StatCards — one per cell, never repeated across unrelated sections.
- Ban multi-gradient celebratory backgrounds like `bg-gradient-to-r from-amber-50 to-amber-100` for generic cards. Gradients are for ambient page tone, premium modules, and meaningful status surfaces — not default card fills.

### 2.2.1 Tonal backgrounds
- Pure white page stacks feel too flat. Use a restrained page gradient when a screen has multiple white cards.
- Dashboard default tone is **Clinic**:
  ```tsx
  page:
    "linear-gradient(180deg, #eef8f6 0%, #f6fbfa 44%, #f7f3ea 100%)"
  header:
    "radial-gradient(900px 340px at 8% -18%, #14b8a638, transparent 62%), radial-gradient(720px 340px at 94% -12%, #0ea5e91a, transparent 68%), linear-gradient(180deg, #eef8f6 0%, #fbfaf7 100%)"
  ```
- Good alternate tones: Mist, Paper, Stone. Keep them subtle. Avoid loud rainbow palettes.
- Prototype-only palette switchers are allowed, but must be collapsible and clearly labelled as a prototype control. Place them low on the page, never above primary actions or floating over core content on mobile.
- Palette choices should persist locally with `localStorage` so visual review survives refreshes.

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

Use tonal cards only when they clarify meaning:
- Metric cards can use a very light top wash: `linear-gradient(180deg, ${accent}12 0%, rgba(255,255,255,0.92) 72%)`.
- Progress/ledger panels can use soft teal/paper gradients with stronger borders.
- Premium is the exception: it should be visually special, not just another amber card.

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
- Premium CTAs should not look like regular feature buttons. Use charcoal/amber treatment:
  ```tsx
  style={{
    background: "#2f281c",
    color: "#fff7ed",
    borderBottomColor: "#a16207",
  }}
  ```

### 2.9 Progress meters
Do not use a bare low-contrast thin bar for XP or leveling progress. It reads as decoration, not state.

A clear progress meter needs:
- Label: `Level Progress`
- Remaining amount: e.g. `720 XP lagi`
- Percent badge: e.g. `10%`
- Refined visible track: `rounded-full border-2 border-teal-100 bg-teal-50/80 p-1`
- Refined fill: `h-4 rounded-full` with a teal gradient `#14b8a6 → #0d9488` and a subtle top highlight.
- Endpoint labels under the bar: current XP on the left, target XP on the right.
- Do not add tick marks or extra mini stat boxes under the progress bar unless the task explicitly needs deeper analytics. Keep it clean but not bare.

This is the minimum clarity bar for any progress UI.

---

## 3. PAGE-SPECIFIC ALIGNMENT

### 3.1 Dashboard ([src/routes/dashboard.tsx](../src/routes/dashboard.tsx))
Dashboard is no longer just the preparation-card recipe repeated. It needs more tone while staying extremely clear.

Required:
- Use the **Clinic** background palette by default (Rule 2.2.1).
- Keep the ambient radial header and measured greeting typography:
  - Kicker: `Beranda`
  - H1: `text-[28px] leading-tight font-bold tracking-tight max-w-[22ch]`
  - Body: `text-[14px] leading-relaxed text-stone-500 max-w-[34ch]`
- Use initials in the top profile circle instead of emoji avatars.
- Navigation should not be a single flat color. Use subtle tonal surfaces:
  - Top bar: warm paper → clinic teal → white translucent gradient.
  - Profile circle: initials with a warm/teal diagonal wash.
  - Metric pills: distinct amber, green, and teal surfaces.
  - Bottom nav: softly layered white/clinic/paper background with each tab owning its own accent.
- Buttons use SVG icons, not emoji prefixes.
- Stat cards use light tonal washes, not plain identical white cards.
- Section titles use the divider pattern. No emoji heading prefixes.
- Progress panel must use the clear XP meter from Rule 2.9.
- Premium must be visually special:
  - Dark charcoal base `#2f281c`
  - Amber borders/CTA `#f5b544`, `#a16207`
  - Subtle radial amber + teal atmosphere
  - Mini stats like `Akurasi`, `Review`, `Latihan`
  - CTA copy like `Buka Premium`
- The premium dialog must match this same dark amber/charcoal language.

Avoid:
- Flat teal hero card.
- White-on-white page with no tone.
- Generic amber gradient feature cards for premium.
- Truncated level names. Let titles wrap cleanly.

### 3.1.1 Profile ([src/routes/profile.tsx](../src/routes/profile.tsx))
Profile is the one screen where emoji can be visually useful, but only as the user's chosen avatar.

Required:
- The profile hero should follow the Dashboard Clinic tone: ambient radial header, measured H1/body, and the soft teal/paper progress panel.
- The large profile identity avatar may render the selected emoji inside a `w-20 h-20 rounded-full` surface with the warm/teal diagonal wash and white border.
- The avatar picker should use a compact 6-column grid of square buttons. Each button uses the card-button rhythm: `aspect-square rounded-2xl border-2 border-b-4 bg-white text-[24px] shadow-sm`.
- Selected emoji avatar state should use teal tinting: `borderColor: "#14b8a655"`, `borderBottomColor: "#0d9488"`, `background: "#ccfbf1"`.
- Account rows, stat cards, copy actions, premium upsell, and empty badge states should still use SVG icons or text-only labels.

Avoid:
- Emoji prefixes in `Profil Belajar`, `Foto Profil`, `Lencana`, `Akun`, or CTA text.
- Emoji as copy buttons, stat icons, lock icons, premium icons, or generic decoration.
- Reusing emoji avatars in the global top navigation if it makes the nav noisy; initials remain the preferred navigation treatment.

### 3.2 Tryout List ([src/routes/tryout.tsx](../src/routes/tryout.tsx))
The list page should feel like a sibling of the preparation screen:
- Add an ambient radial header behind the H2 + subtitle, seeded from `--color-primary`:
  ```tsx
  <div
    className="relative overflow-hidden pb-6"
    style={{ background: `radial-gradient(1000px 300px at 15% -20%, #14b8a622, transparent 60%), var(--color-bg)` }}
  >
  ```
- H2 needs a kicker above it: `Modul Tryout` (uppercase stone-400), then H1-size title.
- Filter pills must use the dot-pill pattern and no emoji labels. `Premium`, not `Premium ⭐`.
- Card title `text-[13.5px] font-bold` not `text-sm font-extrabold` — the preparation screen uses tighter weights.
- Cards inherit `border-b-4 border-b-stone-200` via the surface formula — verify they match.
- Module icons should be SVGs in tinted tiles. Do not render raw module emoji in list cards.

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

Premium dialog exception:
- Use the premium charcoal/amber language from Rule 3.1.
- Header can be dark with radial amber/teal atmosphere.
- Feature rows remain light and readable below the dark header.
- CTA uses the dark premium button, not the generic teal primary button.

---

## 4. THE FIVE QUESTIONS BEFORE COMMITTING A SCREEN

Run this checklist before declaring a page done. Fail any one → revise.

1. **Is there a single color thread?** (one accent across header glow, kicker pill, icon tile, CTA)
2. **Is the hero a flat band or does it have ambient radial depth?** (should be the latter)
3. **Are emojis confined to icon tiles?** (no emojis inside H1/H2/button text/body copy)
4. **Does every heading have a `max-w-[Nch]` sibling or class?** (wraps are deliberate, not accidental)
5. **Do all cards use the single surface formula?** (`bg-white rounded-[--radius-lg] p-5 shadow-sm border-2 border-stone-100 border-b-4 border-b-stone-200`)
6. **Does the page have enough tone?** White cards on a white shell need a subtle page/background tone.
7. **Is premium visually special?** Premium should not look like a normal feature/action card.
8. **Are progress meters self-explanatory without being busy?** They need a label, remaining amount, percent, endpoint values, and a visible track.

---

## 5. ASSET REFERENCES

- Tokens: [src/styles/app.css](../src/styles/app.css) (colors, radii, fonts, `.btn`, `.card`, `.dialog-*`).
- Reference screen source: [src/routes/tryout.$id.tsx](../src/routes/tryout.$id.tsx#L346-L589) (Preparation + Countdown components).
- Dashboard tonal/premium reference: [src/routes/dashboard.tsx](../src/routes/dashboard.tsx) (Clinic palette, Tone Lab, XP meter, premium module).
- Premium dialog reference: [src/components/PremiumDialog.tsx](../src/components/PremiumDialog.tsx).
- Navigation icon reference: [src/components/Navigation.tsx](../src/components/Navigation.tsx).
- StatCard component pattern: [src/routes/tryout.$id.tsx:528](../src/routes/tryout.$id.tsx#L528).
- MiniStat component pattern: [src/routes/tryout.$id.tsx:577](../src/routes/tryout.$id.tsx#L577).
- RuleItem (checklist row) pattern: [src/routes/tryout.$id.tsx:564](../src/routes/tryout.$id.tsx#L564).
- Countdown overlay + `countdownPop` keyframe: [src/routes/tryout.$id.tsx:590-652](../src/routes/tryout.$id.tsx#L590-L652).

When in doubt, open the preparation screen side-by-side with the screen you're editing and match the spacing rhythm, not just the tokens.
