# DACC Design System

**Version:** 2.0
**Last Updated:** February 8, 2026

## Overview

The De Anza Cybersecurity Club design system is inspired by **terminal CLI aesthetics** — raw, functional, and authentically retro. It strips away visual flourishes to reveal a system-level interface that feels like hacking into a mainframe.

**Design Philosophy:**
- **Brutally functional** — every element serves a purpose
- **High contrast** — #33ff00 (neon green) on #0a0a0a (near-black)
- **Zero-radius corners** — no rounded edges anywhere
- **Monospace supremacy** — every character uses monospace fonts
- **Shell metaphors** — `>` prompts, status codes `[200]`, command-line interactions

---

## Color Palette

### Primary Colors
```css
--color-matrix: #33ff00        /* Neon green (primary) */
--color-matrix-dim: #00cc33    /* Dimmed green */
--color-matrix-dark: #00991f   /* Dark green */
--color-matrix-glow: rgba(0, 255, 65, 0.6)  /* Glow effect */
```

### Secondary Colors
```css
--color-amber: #ffb000         /* Amber/orange (secondary accent) */
--color-muted: #1f521f         /* Dimmed green for borders/inactive */
```

### Background & Neutrals
```css
--color-terminal-bg: #0a0a0a   /* Deep black background */
--color-terminal-alt: #0d1117  /* Slightly lighter black */
--color-gray-600: #525252      /* Mid-gray for text */
--color-gray-500: #737373      /* Lighter gray */
--color-gray-400: #a3a3a3      /* Even lighter gray */
```

### System Colors
```css
--color-error: #ff3333         /* Bright red (errors) */
--color-warning: #ffb000       /* Amber (warnings) */
--color-success: #33ff00       /* Matrix green (success) */
```

---

## Typography

### Fonts
```css
--font-mono: "Fira Code", "Share Tech Mono", monospace
--font-terminal: "Share Tech Mono", monospace
```

**Primary:** Fira Code (with ligatures disabled for authenticity)
**Fallback:** Share Tech Mono

### Scale
```css
/* Headers (ALL CAPS) */
.text-xs:     10px
.text-sm:     12px / 14px
.text-base:   14px / 16px
.text-lg:     18px
.text-xl:     20px
.text-2xl:    24px
.text-3xl:    30px
.text-4xl:    36px
.text-5xl:    48px
.text-6xl:    60px
.text-7xl:    72px
```

### Style Rules
- **Headers:** ALWAYS ALL CAPS, bold weight
- **Body text:** Lowercase or sentence case, regular weight
- **Prompts:** Monospace with `>` or `$` prefix
- **Status codes:** Wrapped in brackets `[200]`, `[OK]`, `[ERR]`

---

## Layout & Spacing

### Grid System
- **Max width:** `1280px` (5xl)
- **Padding:** `24px` (6) on mobile, scales up on desktop
- **Gap:** Multiples of 4px (1, 2, 3, 4, 6, 8, 12, 16, 24)

### Border Radius
```css
border-radius: 0px;  /* ALWAYS zero — no rounded corners */
```

### Borders
```css
border: 1px solid rgba(51, 255, 0, 0.2);  /* Standard */
border: 1px dashed rgba(51, 255, 0, 0.5); /* Dashed (for secondary buttons) */
```

---

## Components

### Buttons

#### Filled Button (Primary)
```tsx
<button className="cli-btn-filled">
  <Icon className="w-4 h-4" />
  BUTTON TEXT
</button>
```
**Style:**
- Background: `#33ff00` (solid green)
- Text: `#0a0a0a` (black)
- Padding: `12px 24px`
- Hover: Brighter green + glow

#### Dashed Button (Secondary)
```tsx
<button className="cli-btn-dashed">
  [ BUTTON TEXT ]
</button>
```
**Style:**
- Background: `transparent`
- Border: `1px dashed #33ff00`
- Text: `#33ff00`
- Hover: Fill with `rgba(0, 255, 65, 0.1)`, border becomes solid

### Cards / Panes
```tsx
<div className="border border-matrix/20 p-4 hover:border-matrix/40">
  Content here
</div>
```
**Style:**
- Border: `1px solid rgba(51, 255, 0, 0.2)`
- Background: `transparent`
- Hover: Border brightens to `rgba(51, 255, 0, 0.4)`
- No shadow, no radius

### Shell Prompts
```tsx
<p className="font-mono text-sm">
  <span className="text-matrix">&gt;</span> command here
</p>
```

### Status Indicators
```tsx
<span className="flex items-center gap-2">
  <span className="w-1.5 h-1.5 bg-matrix animate-pulse" />
  ONLINE
</span>
```

---

## Effects & Animations

### Text Glow
```css
.neon-text-subtle {
  text-shadow:
    0 0 5px rgba(0, 255, 65, 0.6),
    0 0 10px rgba(0, 255, 65, 0.3);
}
```

### Cursor Blink
```css
.cli-cursor {
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}
```

### CRT Scanlines
Applied globally via `.crt-overlay`:
- Horizontal scanlines (2px repeating)
- Radial vignette (darker edges)
- Subtle flicker animation (optional)

### Transitions
```css
transition: all 0.2s ease;  /* Standard */
transition: border-color 0.2s ease;  /* Specific property */
```

---

## Iconography

**Library:** Custom SVG icon set in `@/lib/cyberIcon`

**Usage:**
```tsx
import { Shield, Code, Trophy } from "@/lib/cyberIcon"

<Shield className="w-5 h-5 text-matrix/40" />
```

**Style:**
- Line-based (not filled)
- Stroke width: 1.5 - 2px
- Color: `text-matrix/40` (dimmed), `text-matrix` on hover

---

## Accessibility

### Contrast
- Primary text (#33ff00) on black (#0a0a0a): **14.2:1** (WCAG AAA)
- Gray text (#737373) on black: **4.9:1** (WCAG AA)

### Focus States
```css
.focus-visible:outline {
  outline: 2px solid #33ff00;
  outline-offset: 2px;
}
```

### Motion
- Respect `prefers-reduced-motion` for animations
- Pause CRT effects on inactive tabs

---

## Code Conventions

### Class Naming
```tsx
// Standard Tailwind
<div className="border border-matrix/20 p-4" />

// Custom CLI classes
<button className="cli-btn-filled" />
<div className="cli-cursor" />
```

### Component Structure
```tsx
// ─── Section Title ───────────────────────────────────
function ComponentName() {
  return (
    <section className="...">
      {/* Comment */}
      <div className="...">...</div>
    </section>
  )
}
```

### Shell Comment Pattern
```tsx
{/* ════════════════════════════════════════════
    SECTION NAME
    ════════════════════════════════════════════ */}
```

---

## Usage Examples

### Hero Section
```tsx
<section className="min-h-screen flex flex-col justify-center">
  <p className="font-mono text-sm text-matrix/60">
    <span className="text-matrix">&gt;</span> WELCOME, USER
  </p>
  <h1 className="font-mono font-bold text-7xl text-matrix uppercase">
    LEARN TO HACK.
    <br />
    LEARN TO DEFEND.
  </h1>
  <button className="cli-btn-filled">
    <Discord className="w-4 h-4" />
    JOIN DISCORD
  </button>
</section>
```

### Stats Bar
```tsx
<div className="border-t border-b border-matrix/20">
  <div className="grid grid-cols-4">
    <div className="px-6 py-8 border-r border-matrix/20">
      <p className="font-mono text-xs text-matrix/60 uppercase">
        ACTIVE MEMBERS
      </p>
      <p className="font-mono text-4xl font-bold text-matrix neon-text-subtle">
        90+
      </p>
    </div>
    {/* Repeat for other stats */}
  </div>
</div>
```

### Card with Hover
```tsx
<div className="border border-matrix/20 p-5 hover:border-matrix/40 transition-colors group">
  <Shield className="w-5 h-5 text-matrix/40 group-hover:text-matrix" />
  <h3 className="font-mono font-bold text-matrix uppercase">TITLE</h3>
  <p className="font-mono text-xs text-gray-500">Description text...</p>
</div>
```

---

## Don'ts

❌ **Never use:**
- Rounded corners (`border-radius > 0`)
- Drop shadows
- Gradients (except for scan effects)
- Sans-serif fonts
- Emojis (except ❤️ in footer)
- Smooth animations > 300ms

❌ **Avoid:**
- Multiple font weights in the same context
- Color outside the palette
- Mixing case styles (e.g., Title Case in headers)

---

## Resources

- **Fonts:** [Fira Code](https://github.com/tonsky/FiraCode), [Share Tech Mono](https://fonts.google.com/specimen/Share+Tech+Mono)
- **Inspiration:** Terminal emulators (iTerm2, Hyper), hacker movie UIs
- **Tools:** Tailwind CSS v4, React, TypeScript

---

**Maintained by:** Aaron Ma
