---
name: Horizon 3D Print
description: Indonesian 3D printed toys and custom figures — serious craft, playful soul.
colors:
  sky: '#5BB8FF'
  sky-dark: '#2F9CEC'
  sky-light: '#A9DAFF'
  sky-wash: '#EAF6FF'
  gold: '#FFC23C'
  gold-dark: '#F0A816'
  gold-light: '#FFD466'
  paper: '#F7F3EC'
  paper-2: '#EDE7DB'
  ink: '#16110A'
  ink-2: '#3A3225'
  fog: '#6B5F4A'
  line: '#D9CFB9'
  white-warm: '#FFFDF7'
typography:
  display:
    fontFamily: "'Bricolage Grotesque', system-ui, sans-serif"
    fontWeight: 800
    fontStretch: '75%'
    lineHeight: 0.92
    letterSpacing: '-0.03em'
  serif-italic:
    fontFamily: "'Instrument Serif', Georgia, serif"
    fontStyle: italic
    fontWeight: 400
    letterSpacing: '-0.01em'
  body:
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
    fontSize: '15px'
    fontWeight: 400
    lineHeight: 1.5
  eyebrow:
    fontFamily: "'JetBrains Mono', ui-monospace, monospace"
    fontSize: '11px'
    fontWeight: 500
    letterSpacing: '0.16em'
    textTransform: uppercase
  mono:
    fontFamily: "'JetBrains Mono', ui-monospace, monospace"
    fontWeight: 600
rounded:
  card: '22px'
  card-soft: '14px'
  btn: '999px'
  sm: '8px'
components:
  button-accent:
    backgroundColor: '{colors.gold}'
    textColor: '{colors.ink}'
    border: '1.5px solid {colors.ink}'
    shadow: '3px 3px 0 {colors.ink}'
    height: '44px'
    rounded: '999px'
  button-accent-hover:
    transform: 'translate(-1px, -1px)'
    shadow: '4px 4px 0 {colors.ink}'
  button-primary:
    backgroundColor: '{colors.ink}'
    textColor: '{colors.paper}'
    height: '44px'
    rounded: '999px'
  button-sky:
    backgroundColor: '{colors.sky}'
    textColor: '{colors.ink}'
    border: '1.5px solid {colors.ink}'
    height: '44px'
    rounded: '999px'
  button-ghost:
    backgroundColor: 'transparent'
    textColor: '{colors.ink}'
    border: '1.5px solid {colors.line}'
    height: '44px'
    rounded: '999px'
  card:
    backgroundColor: '{colors.white-warm}'
    rounded: '22px'
    border: '1.5px solid {colors.ink}'
    shadow: '4px 4px 0 {colors.ink}'
  card-soft:
    backgroundColor: '{colors.white-warm}'
    rounded: '14px'
    border: '1px solid {colors.line}'
  chip:
    rounded: '999px'
    height: '26px'
    padding: '0 10px'
    fontFamily: mono
    fontSize: '11px'
    letterSpacing: '0.04em'
    textTransform: uppercase
---

# Design System: Horizon 3D Print

## 1. Overview

**Creative Direction: "From Pixel to Physical"**

Sky blue energy meets golden warmth on a warm paper canvas. The aesthetic sits between a modern maker studio and a playful product brand — professional enough for small business owners, approachable enough for first-time buyers.

Bold compressed display type creates dramatic scale moments. Instrument Serif italic adds editorial softness as a contrast pair. JetBrains Mono grounds specs and prices in precision. Cards have chunky offset shadows at rest — surfaces feel physical and tactile. The frosted glass nav anchors without dominating.

**Key Characteristics:**

- Warm paper background (`#F7F3EC`) — never pure white
- Chunky offset shadow (`4px 4px 0 #16110A`) on `.card` at rest — the tactile signature
- Sky Blue (`#5BB8FF`) as the primary interactive color
- Gold (`#FFC23C`) as the action/accent color — CTAs, cart badges, footer accents
- Frosted glass navbar: `rgba(247,243,236,0.88)` + `backdrop-filter: blur(12px)`
- Pill-shaped nav items: ink fill when active, transparent at rest
- Bricolage Grotesque at `font-stretch: 75%` — condensed, heavy, commanding
- Instrument Serif italic for editorial contrast moments only (never standalone headings)
- 4-font system: Display + Body + Mono + Serif

## 2. Colors

### Primary

- **Sky** (`#5BB8FF`): Primary interactive. Buttons, active states, avatar backgrounds.
- **Sky Dark** (`#2F9CEC`): Hover on sky surfaces.
- **Sky Wash** (`#EAF6FF`): Image placeholders, subtle tinted backgrounds.

### Accent

- **Gold** (`#FFC23C`): Action color. CTA buttons, cart badges, footer eyebrow labels, sparkle/star decorations. Always with ink border + offset shadow.
- **Gold Dark** (`#F0A816`): Hover on gold surfaces.
- **Gold Light** (`#FFD466`): Subtle gold tint for priority/rush states.

### Neutral

- **Paper** (`#F7F3EC`): Page background. Warm, never cold.
- **Paper-2** (`#EDE7DB`): Secondary surfaces, ghost button hover.
- **Ink** (`#16110A`): Primary text, card borders, button borders, offset shadows.
- **Fog** (`#6B5F4A`): Secondary text, captions, disabled states.
- **Line** (`#D9CFB9`): Dividers, input borders at rest, card-soft borders.
- **White-warm** (`#FFFDF7`): Card backgrounds.

## 3. Typography

**4-font system:**

- **Display:** Bricolage Grotesque — `800wt`, `font-stretch: 75%`, `letter-spacing: -0.03em`, `line-height: 0.92`
- **Body:** Plus Jakarta Sans — `400–600wt`, `line-height: 1.5`
- **Mono:** JetBrains Mono — prices, specs, order IDs, eyebrow labels
- **Serif:** Instrument Serif italic — editorial contrast paired with Bricolage only

### Hierarchy

- **Display** (Bricolage 800 75%): Hero headings, section titles. Left-aligned. Massive.
- **Serif italic** (Instrument Serif italic): Contrast pair. Example: `"Make anything.` _right now._`"`
- **Body** (Plus Jakarta Sans 400): Prose, descriptions. Max 65ch.
- **Eyebrow** (JetBrains Mono 500, 11px, 0.16em, uppercase): Section kickers, category labels.
- **Mono** (JetBrains Mono 600): Prices, SKUs, order IDs, quantities.

### Named Rules

**The Stretch Rule.** Bricolage always at `font-stretch: 75%`. Body and serif always at `100%`.

**The Serif Contrast Rule.** Instrument Serif italic only appears paired with Bricolage display. Never standalone headings.

## 4. Elevation

| Class         | Border            | Shadow                   | Use                               |
| ------------- | ----------------- | ------------------------ | --------------------------------- |
| `.card`       | `1.5px solid ink` | `4px 4px 0 ink` (always) | Product cards, panels, CTA blocks |
| `.card-soft`  | `1px solid line`  | none                     | Tables, stat surfaces             |
| `.card-paper` | `1px solid line`  | none                     | Form sections, tertiary           |

**The Chunky Shadow Rule.** `.card` shadow is permanent — not an interaction state. `.btn-accent` shadow lifts on hover (translate -1px-1px, shadow grows 3px → 4px). No gaussian blur anywhere in this system.

## 5. Components

### Navigation

- Frosted glass: `rgba(247,243,236,0.88)`, `backdrop-filter: blur(12px)`, `border-bottom: 1px solid line`
- Logo: H-mark SVG (gold left stripe, sky right stripe, warm crossbar) + Bricolage wordmark + mono subtext "PRINT · MAKE · SHIP"
- Nav pills: transparent → ink fill + paper text on active. `border-radius: 999px`
- Right: cart icon (gold count badge), auth dropdown or sign-in link, gold "Start Printing" CTA
- Mobile: hamburger → stacked pills + CTA strip

### Buttons

- **Accent (gold):** Primary CTAs everywhere. Ink border + 3px offset shadow that lifts on hover.
- **Primary (ink):** Submit, Save, Confirm.
- **Sky:** View all, Explore — brand-colored secondary.
- **Ghost:** Cancel, Back, icon-only. Transparent, line border.
- All: `border-radius: 999px`, height 44px (sm: 36px, lg: 56px).

### Cards

- `.card`: Product tiles, panels, queue items. Chunky shadow at rest. `border-radius: 22px`.
- `.card-soft`: Stats, tables, info panels. No shadow.
- Never nest cards. Never side-stripe border.

### Chips

- Pill-shaped, mono font, 11px, uppercase, 26px tall.
- Variants: default, gold, sky, ink (inverted), ok, warn, err.

### Footer

- Dark ink bg with paper text.
- Marquee: Bricolage 800 75%, 26px, brand statements with gold ★ and sky ◆ separators.
- 5-column grid: brand blurb + 4 link columns with gold eyebrow titles.
- Bottom bar: mono text + animated green system status dot.

### 3D Model Viewer

- `@google/model-viewer` wrapped in sky-wash container, 14px radius, 1.5px ink border.
- CSS cube placeholder: gold front, sky back/sides, spins on hover.

## 6. Do's and Don'ts

### Do:

- **Do** use `font-stretch: 75%` on all Bricolage headings.
- **Do** give `.card` its offset shadow at rest — it's always there, not a hover state.
- **Do** use Gold for action only: CTAs, cart badges, footer accents.
- **Do** pair Instrument Serif italic with Bricolage for editorial contrast moments.
- **Do** use JetBrains Mono for all prices, IDs, quantities, and eyebrow labels.
- **Do** use warm paper (`#F7F3EC`) as page background.
- **Do** use pill-shaped nav items.

### Don't:

- **Don't** use `#fff` or `#000`. Use `#FFFDF7` (white-warm) and `#16110A` (ink).
- **Don't** use gradient text or gradient backgrounds.
- **Don't** add gaussian blur shadows — only hard 0-blur offset shadows.
- **Don't** nest cards.
- **Don't** use side-stripe borders (`border-left` as a colored accent).
- **Don't** use Instrument Serif standalone for headings.
- **Don't** make it look like a marketplace clone: no badge storms, no orange/red sale stickers.
