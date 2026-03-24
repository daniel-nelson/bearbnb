# Design System — BearBnB (Guest Client)

## Product Context
- **What this is:** A vacation rental marketplace for bears — an Airbnb clone demo for Dream ORM + Psychic framework
- **Who it's for:** Bears looking for dens, lodges, and retreats to book
- **Space/industry:** Vacation rental / hospitality (Airbnb, VRBO, Hipcamp)
- **Project type:** Guest-facing web app (Next.js + Tailwind CSS)
- **Scope:** Guest client app only. Admin has a separate design system.

## Aesthetic Direction
- **Direction:** Organic/Playful — warm, nature-inspired, with genuine personality
- **Decoration level:** Intentional — subtle texture (paper grain on hero sections, soft shadow depth on cards). Warmth comes from color and type, not gratuitous illustration.
- **Mood:** National park lodge meets modern web app. Thoughtful, warm, and delightful without being juvenile. The product should feel like it has soul — not a corporate rental clone.

## Typography
- **Display/Hero:** Fraunces (variable serif, optical sizing) — soft curves, warmth, feels like hand-carved wood signage at a wilderness lodge. This is where BearBnB gets its face.
- **Body:** Plus Jakarta Sans — rounded terminals, friendly and highly readable. Pairs with Fraunces without competing.
- **UI/Labels:** Plus Jakarta Sans (same as body, weight 600 for labels)
- **Data/Tables:** Geist Mono (tabular-nums) — clean, precise for prices, dates, booking numbers. Contrast with warmer display type makes data feel trustworthy.
- **Code:** JetBrains Mono
- **Loading:** Google Fonts CDN
  ```html
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,100..900;1,9..144,100..900&family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&family=Geist+Mono:wght@100..900&display=swap" rel="stylesheet">
  ```
- **Scale:**
  | Token | Size | Weight | Font | Usage |
  |-------|------|--------|------|-------|
  | display-xl | 60px | 700 | Fraunces | Hero headlines |
  | display-lg | 48px | 700 | Fraunces | Page titles |
  | heading-lg | 36px | 600 | Fraunces | Section headings |
  | heading-md | 30px | 600 | Fraunces | Subsection headings |
  | heading-sm | 24px | 500 | Fraunces | Card group titles |
  | title | 20px | 500 | Fraunces | Card titles, listing names |
  | body-lg | 18px | 400 | Plus Jakarta Sans | Lead paragraphs |
  | body | 16px | 400 | Plus Jakarta Sans | Default body text |
  | body-sm | 14px | 400 | Plus Jakarta Sans | Secondary text, UI labels |
  | caption | 12px | 600 | Plus Jakarta Sans | Overlines, captions (uppercase, 0.06em tracking) |

## Color

### Approach
Balanced — warm palette, color used meaningfully. Not so restrained it's boring, not so expressive it competes with listing photos.

### Brand Colors
| Token | Hex | Name | Usage |
|-------|-----|------|-------|
| `--honey` | `#C67A1E` | Honey Amber | Primary CTAs, active states, key highlights |
| `--honey-light` | `#E8A84C` | Honey Light | Hover states, light accents |
| `--honey-dark` | `#9A5E12` | Honey Dark | Pressed states, high-contrast text on light |
| `--forest` | `#2B6B4F` | Forest Evergreen | Secondary actions, success states, trust signals |
| `--forest-light` | `#3D8A68` | Forest Light | Hover on secondary |
| `--forest-dark` | `#1E4D38` | Forest Dark | Pressed on secondary |
| `--campfire` | `#B84C2A` | Campfire Red | Favorites/hearts, urgent alerts, warmth pops (use sparingly) |
| `--campfire-light` | `#D4693E` | Campfire Light | Hover on accent |

### Neutrals (warm gray-browns)
| Token | Hex | Name | Usage |
|-------|-----|------|-------|
| `--birch` | `#FAF7F2` | Birch | Lightest background |
| `--parchment` | `#F0EBE3` | Parchment | Card/surface background |
| `--driftwood` | `#C4B9A8` | Driftwood | Borders, dividers, placeholders |
| `--stone` | `#8A7E6E` | Stone | Muted text, secondary labels |
| `--bark` | `#4A4239` | Bark | Body text |
| `--charcoal` | `#2A2520` | Charcoal | Headings, high-emphasis text |

### Semantic
| Token | Hex | Usage |
|-------|-----|-------|
| success | `#2B6B4F` | Confirmation, booking confirmed, verified |
| warning | `#D4960B` | Low availability, price alerts |
| error | `#B84C2A` | Payment failures, validation errors |
| info | `#3B7EA1` | Informational, policies, cancellation |

### Dark Mode Strategy
- Background: `#1A1714` / Surface: `#252119` / Border: `#3D3630`
- Text: body `#D4C9B8` / heading `#F0EBE3` / muted `#9A8E7E`
- Honey shifts lighter to `#E8A84C` for visibility
- Forest shifts to `#4AAA7E`, campfire to `#D4693E`
- Reduce saturation ~10-20% on brand colors; increase lightness for readability

## Spacing
- **Base unit:** 8px
- **Density:** Comfortable — rental platforms need breathing room. Generous padding on cards, photos get space to breathe.
- **Scale:**
  | Token | Value |
  |-------|-------|
  | 2xs | 2px |
  | xs | 4px |
  | sm | 8px |
  | md | 16px |
  | lg | 24px |
  | xl | 32px |
  | 2xl | 48px |
  | 3xl | 64px |

## Layout
- **Approach:** Grid-disciplined — users expect predictable layouts for search/browse/book flows. Personality injected through typography, color, and micro-interactions, not layout chaos.
- **Grid:** 12 columns. Mobile: 4 cols. Tablet: 8 cols. Desktop: 12 cols.
- **Max content width:** 1200px
- **Border radius:**
  | Token | Value | Usage |
  |-------|-------|-------|
  | sm | 4px | Small elements, tags |
  | md | 8px | Buttons, inputs, badges |
  | lg | 12px | Cards, modals |
  | xl | 16px | Large containers, hero sections |
  | full | 9999px | Avatars, pills, search bar |

## Motion
- **Approach:** Intentional — subtle spring easings on interactions that feel slightly bouncy. Alive, not mechanical. Nothing bounces so much it feels like a toy.
- **Easing:**
  | Token | Value | Usage |
  |-------|-------|-------|
  | spring | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Micro-interactions (card hover, button press) — slight overshoot |
  | ease-out | `cubic-bezier(0.16, 1, 0.3, 1)` | Entrances, page transitions |
  | ease-in | `cubic-bezier(0.7, 0, 0.84, 0)` | Exits, dismissals |
  | ease-in-out | `cubic-bezier(0.65, 0, 0.35, 1)` | Movement, repositioning |
- **Duration:**
  | Token | Value | Usage |
  |-------|-------|-------|
  | micro | 50-100ms | Hover color changes, focus rings |
  | short | 150-250ms | Button press, toggle, badge appear |
  | medium | 250-400ms | Card hover lift, modal enter, search expand |
  | long | 400-700ms | Page transitions, hero entrance |

## Shadows
| Token | Value | Usage |
|-------|-------|-------|
| sm | `0 1px 3px rgba(42,37,32,0.06), 0 1px 2px rgba(42,37,32,0.04)` | Buttons, subtle elevation |
| md | `0 4px 12px rgba(42,37,32,0.08), 0 2px 4px rgba(42,37,32,0.04)` | Cards at rest, dropdowns |
| lg | `0 12px 32px rgba(42,37,32,0.12), 0 4px 8px rgba(42,37,32,0.06)` | Card hover, modals, booking widget |

## Anti-Patterns (never do these)
- Purple/violet gradients
- 3-column feature grid with icons in colored circles
- Centered everything with uniform spacing
- Uniform bubbly border-radius on all elements
- Generic stock-photo hero sections
- Bear paw prints, cartoon bears, or clip-art as decoration (the brand personality comes from color, type, and tone — not literal bear imagery)

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-23 | Initial design system created | Created by /design-consultation. Organic/Playful aesthetic with Fraunces + Plus Jakarta Sans + Geist. Warm honey/forest/campfire palette. |
| 2026-03-23 | Fraunces as display font (RISK) | No rental platform uses a soft variable serif. Immediately signals personality and warmth. Differentiator. |
| 2026-03-23 | Honey amber primary instead of blue (RISK) | Most platforms lean blue for trust. BearBnB trades that for warmth and bear-coding. Trust via forest green secondary + clean data type. |
| 2026-03-23 | Spring easings on micro-interactions (RISK) | Most rental sites have zero animation personality. Slight bounce adds life and tactile feel. |
| 2026-03-23 | Guest client only | Admin app gets its own design system. This system is scoped to the guest-facing client. |
