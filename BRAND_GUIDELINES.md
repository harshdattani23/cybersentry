# Design System Specification: The Fortified Interface

## 1. Overview & Creative North Star: "The Digital Bastion"
This design system is built to transcend the generic "tech dashboard" aesthetic. Our Creative North Star is **The Digital Bastion**: a visual philosophy that marries the unwavering authority of a government institution with the sophisticated transparency of modern cybersecurity. 

Unlike standard government portals that rely on rigid grids and heavy borders, this system utilizes **Layered Depth** and **Intentional Asymmetry**. We break the "template" look by using wide, editorial-style margins and overlapping elements that suggest a multi-dimensional defense-in-depth strategy. The interface should feel like a physical high-security facility: clean, quiet, and profoundly solid.

## 2. Color Strategy & Tonal Architecture
The palette is rooted in deep, authoritative blues and slate grays, punctuated by high-visibility functional accents.

### The "No-Line" Rule
To achieve a premium, custom feel, **1px solid borders are strictly prohibited for sectioning.** Do not use lines to separate content. Instead, define boundaries through:
*   **Background Shifts:** Transitioning from `surface` to `surface-container-low`.
*   **Tonal Nesting:** Placing a `surface-container-lowest` card atop a `surface-container` background.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers.
*   **Base:** `surface` (#f9f9ff) – The primary canvas.
*   **Structure:** Use `surface-container-low` (#f0f3ff) for large structural blocks.
*   **Emphasis:** Use `surface-container-highest` (#d8e3fb) for sidebars or critical utility panels.
*   **Nesting:** An information card (`surface-container-lowest`) should always sit on a slightly darker surface (like `surface-container-low`) to create a natural "lift" without artificial drop shadows.

### The "Glass & Gradient" Rule
To inject "visual soul" into the high-trust environment:
*   **Hero Sections:** Use a subtle linear gradient from `primary` (#000000) to `primary-container` (#001d35) at a 135-degree angle.
*   **Floating Elements:** Use Glassmorphism for navigation bars and overlays. Apply `surface` with 80% opacity and a `20px` backdrop-blur to allow the content beneath to bleed through softly.

## 3. Typography: Editorial Authority
The type system pairs the geometric precision of **Manrope** for display with the high-utility legibility of **Inter** for data.

*   **Display (Manrope):** Use `display-lg` and `display-md` for high-impact awareness headlines. The oversized scale conveys government-level authority.
*   **Headlines (Manrope):** `headline-lg` (2rem) should be used for section titles, providing a rhythmic break from dense information.
*   **Body & Labels (Inter):** All functional text uses Inter. `body-lg` (1rem) is our workhorse for readability. 
*   **Hierarchy Note:** Use `on-surface-variant` (#44474c) for secondary metadata to create a clear visual distinction from the primary `on-surface` (#111c2d) content.

## 4. Elevation & Depth: Tonal Layering
We reject the "flat" web. However, we avoid heavy, muddy shadows that feel dated.

*   **The Layering Principle:** Depth is achieved by stacking. A `surface-container-lowest` (#ffffff) card placed on a `surface-dim` (#cfdaf2) background creates an immediate sense of importance and "float" through color theory alone.
*   **Ambient Shadows:** For high-priority floating elements (e.g., alert modals), use an extra-diffused shadow: `0px 20px 40px rgba(17, 28, 45, 0.06)`. The shadow uses a tint of `on-surface` rather than pure black.
*   **The "Ghost Border" Fallback:** If a container requires a boundary (e.g., an input field), use the `outline-variant` (#c4c6cc) at **20% opacity**. Never use 100% opaque outlines.

## 5. Components & Interaction Patterns

### Buttons: The "Solid-State" Approach
Buttons should feel like physical switches—dependable and heavy.
*   **Primary:** Solid `primary` (#000000) with `on-primary` (#ffffff) text. Use `md` (0.375rem) roundedness.
*   **Secondary:** `secondary-container` (#d5e3fc) background with `on-secondary-container` (#57657a) text.
*   **Tertiary (Security Accents):** For "Safe" or "Success" actions, use `tertiary-fixed` (#6ffbbe) with `on-tertiary-fixed` (#002113).

### Input Fields: Trusted Entry
*   **Background:** `surface-container-low` (#f0f3ff).
*   **Active State:** Use a 2px "Ghost Border" of `surface-tint` (#446180) and a subtle inner glow. 
*   **Error State:** Use `error` (#ba1a1a) text for helper messages, but keep the input background neutral to maintain "calm" under pressure.

### Cards & Information Modules
*   **Forbidden:** Divider lines (`<hr>`).
*   **Mandatory:** Use **Spacing Scale 8** (2rem) as the default internal padding. 
*   **Separation:** Use vertical white space (Spacing 10 or 12) or a background shift to `surface-container` to isolate modules.

### Custom Component: The "Threat Status" Chip
A high-end status indicator using a semi-transparent `tertiary-container` (#002113) background with a glowing `tertiary-fixed-dim` (#4edea3) dot to signify active protection.

## 6. Do’s and Don’ts

### Do
*   **Do** use asymmetrical layouts. For example, a hero headline might be offset to the left while the supporting graphic sits slightly lower on the right.
*   **Do** use the Spacing Scale strictly. Align elements to the `4px` or `8px` increments to ensure the "solid" feel of the system.
*   **Do** leverage `surface-bright` for areas meant to draw the eye in a sea of navy and slate.

### Don't
*   **Don't** use 100% black (#000000) for text. Use `on-surface` (#111c2d) for a softer, more premium contrast.
*   **Don't** use standard "Alert Red" for everything. Use `on-error-container` (#93000a) for a more sophisticated, "controlled" sense of urgency.
*   **Don't** use rounded corners larger than `xl` (0.75rem) for main containers. We want "Dependable," not "Playful." Save the `full` (9999px) roundedness for small chips and pills only.
