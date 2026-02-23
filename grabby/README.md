# Grabby

**Grabby** is a simple userscript that lets you quickly grab and copy larger and larger blocks of text from any webpage - even on sites that block text selection or copying.

### Main Shortcuts

- **Shift + C**  
  Grabs the deepest meaningful text under the cursor  
  Copies it to clipboard automatically (no manual selection needed)  
  Next press escalates to a parent only if it has more text

- **Shift + X**  
  Full reset - clears everything and restores original element styles

### How It Works

- Allows up to 5 successful grabs (counter stops at 5)  
- After the 5th grab: further presses show warning only (no new copy)  
- Works only within the same DOM branch (must be ancestor/descendant)  
- Ignores text from `aria-hidden="true"` elements  
- Temporarily forces selectable style on grabbed elements  
- Last copied text stays in clipboard until next grab or full reset

### Core Purpose

Grabby bypasses common copy protections (user-select: none, oncopy blockers, etc.) by directly copying text without relying on normal browser selection.

### Installation

1. Install a userscript manager:  
   Tampermonkey (Chrome/Edge)  
   Violentmonkey (Firefox/Chrome)  
   Userscripts (Safari/iOS)

2. Create a new script and paste the code from `grabby.user.js`

(Optional) Limit to specific sites via the extension dashboard by adding `@match` lines.

Copy faster and easier - even where copying is "not allowed".
