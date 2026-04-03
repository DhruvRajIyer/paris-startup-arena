```markdown
# Design System: The Cinematic Nocturne

## 1. Overview & Creative North Star

**Creative North Star: The Digital Curator**
This design system is not a utility; it is a gallery. We are moving away from the "SaaS Dashboard" aesthetic and toward a high-end, museum-quality editorial experience. The interface should feel like a late-night stroll through a Parisian archive—dark, quiet, and illuminated by the warm glow of discovery.

To break the "template" look, we prioritize **intentional asymmetry** and **spatial depth**. We reject the rigid, centered grid in favor of overlapping elements, varying typography scales, and a 3D isometric environment that serves as the foundation of the user's journey. Every interaction should feel cinematic, as if a camera is panning across a physical map.

---

## 2. Colors & Surface Logic

We operate exclusively in "Warm Near-Blacks." Pure #000000 and pure #FFFFFF are strictly prohibited. This ensures the interface feels organic and expensive, rather than digital and harsh.

### The Palette
- **Void (`surface`):** #060604 — The infinite canvas.
- **Abyss (`surface-container-low`):** #0E0D0A — The primary container for content cards.
- **Shadow (`outline-variant`):** #1C1A14 — Subtle depth markers.
- **Gold (`primary`):** #C8A96E — Our source of light. Use for CTAs, active states, and interactive glows.
- **Cream (`on-surface`):** #E8DFC8 — High-legibility text.
- **Cream-Dim (`on-surface-variant`):** #9A9282 — Secondary information.
- **Muted (`tertiary`):** #4A4030 — Labels and metadata.

### The "No-Line" Rule
Sectioning must never be achieved via 1px solid borders. Boundaries are defined by:
1.  **Tonal Shifts:** Placing an Abyss (#0E0D0A) card against the Void (#060604) background.
2.  **Negative Space:** Utilizing the spacing scale to create mental groupings.
3.  **Shadow Transitions:** Subtle, wide-area ambient occlusion.

### Glass & Texture
For overlays and filter panels, use **Glassmorphism**.
- **Background:** `rgba(14, 13, 10, 0.8)`
- **Blur:** `backdrop-filter: blur(12px)`
- **Border:** A "Ghost Border" using Gold (#C8A96E) at 15% opacity to catch the light.

---

## 3. Typography: Editorial Authority

Typography is the primary driver of the brand's premium feel. We mix the classic elegance of a Serif with the technical precision of a Monospace.

| Level | Token | Font | Specs | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Display** | `display-lg` | Cormorant Garamond | 300 Weight, Roman | Hero headlines and startup names. |
| **Accent Display** | `display-md` | Cormorant Garamond | 300 Weight, Italic | Featured quotes or "Paris" callouts. |
| **UI Label** | `label-md` | DM Mono | Uppercase, 0.12em tracking | Stats, Badges, Category labels. |
| **Body** | `body-md` | Cormorant Garamond | 400 Weight, Italic, 15px | Descriptions and long-form narrative. |

**Editorial Note:** Use Roman for stability and Italic for "the human touch." Never center-align long-form body text; stick to intentional left-aligned blocks to maintain a modern editorial rhythm.

---

## 4. Elevation & Depth

We do not use "drop shadows" in the traditional sense. We use **Tonal Layering** and **3D Transforms**.

### The Layering Principle
Hierarchy is achieved by stacking surface-container tiers.
- **Level 0 (Floor):** Void (#060604) containing the 3D Paris Map.
- **Level 1 (Surface):** Abyss (#0E0D0A) for job cards.
- **Level 2 (Float):** Glass panels with backdrop blur for navigation.

### 3D Perspective
To reinforce the isometric nature of the map, content cards must utilize a subtle 3D tilt:
- **Default State:** `transform: rotateX(2deg) rotateY(-1deg);`
- **Hover State:** `transform: rotateX(0deg) rotateY(0deg) scale(1.02);`
- **Hover Glow:** Apply a `box-shadow` of `0 20px 40px rgba(200, 169, 110, 0.08)`. It should look like the card is hovering over a golden light source.

---

## 5. Components

### Buttons
- **Primary:** Gold (#C8A96E) background, Void (#060604) text. DM Mono, Uppercase. No rounded corners (`border-radius: 0px` or `sm: 0.125rem`).
- **Secondary:** Ghost variant. Cream border at 20% opacity. On hover, the border opacity moves to 100%.

### Sector Badges
Use the specific Sector Colors provided (DeepTech, HealthTech, etc.) but apply them as **Glows**, not solid fills.
- **Style:** 1px "Ghost Border" of the sector color + a very subtle 5% opacity background tint. Text remains DM Mono Uppercase.

### Interactive Map Pins
The "Gold Wireframe Glow" is the hero here. Pins should be simple geometric shapes (diamonds or circles) with a CSS `filter: drop-shadow(0 0 5px #C8A96E)`.

### Cards
- **Rule:** Forbid divider lines within cards.
- **Separation:** Use a vertical 1.4rem (`spacing-4`) gap between the Job Title (Serif) and the Company Stats (Mono).

---

## 6. Do's and Don'ts

### Do
*   **Do** use extreme white space. Let the "Void" background breathe.
*   **Do** use Cormorant Garamond Italic for industry terms to add a "signature" feel.
*   **Do** ensure all interactive elements have a transition timing of at least `300ms ease-out` to maintain the cinematic feel.

### Don't
*   **Don't** use standard 400px wide cards. Vary the widths to create an asymmetric, masonry-style discovery feed.
*   **Don't** use high-contrast white text. Stick to Cream (#E8DFC8) to protect the dark-room atmosphere.
*   **Don't** use sharp, 90-degree corners for containers if they sit near the isometric map; use the `sm` (0.125rem) radius to soften the digital edge.

### Accessibility Note
While the atmosphere is dark, ensure all Cream-on-Abyss text combinations pass WCAG AA contrast ratios. For Muted (#4A4030) text, only use it for non-essential metadata and ensure it is paired with a larger font size if necessary.```