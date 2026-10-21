// ============================================================
//  FOOTHOLD BRAND — the single source of truth for brand colors
//  and fonts, used by every shell page (Landing, Dashboard,
//  Login, loading screens) and by every future Foothold course.
//
//  Palette source: "Foothold python_branding/brand/README.html"
//  (v1 logo handoff). If the brand ever changes, edit THIS file
//  and every page follows. Never hardcode these hex values in
//  shell components.
//
//  Note: lesson files (src/lessons/*.jsx) deliberately keep
//  their own dark "focus mode" theme — code reads best on dark.
//  The cream brand look is the campus; dark is the classroom.
// ============================================================

export const BRAND = {
  // Surfaces
  cream:     '#F1EEE6',  // page background
  card:      '#FFFFFF',  // card / row surfaces
  creamDeep: '#EDE8DC',  // inline-code chips, subtle fills
  border:    '#E7E0D2',  // hairline borders

  // Ink
  navy:      '#16294A',  // primary text, solid buttons, dark panels
  slate:     '#40506A',  // secondary body text
  mist:      '#8A97AB',  // muted small print

  // Accents
  amber:     '#E7A13E',  // THE accent — highlights, hooks, Crucible fire
  bronze:    '#B08343',  // kickers (small uppercase mono labels)
  codeBrown: '#B0651F',  // code text on cream chips

  // Feedback
  green:     '#1F7A4D',  // success / completed (readable on cream)
  red:       '#B0322F',  // errors

  // On-navy (for dark panels like the landing terminal)
  panelText: '#E7EAF0',
};

// ============================================================
//  DARK — the shell's dark-and-on-brand palette.
//
//  Why this exists: the lessons (src/lessons/*.jsx) live on a
//  GitHub-style dark canvas. To make the whole app feel like one
//  continuous place, the shell pages (Landing, Dashboard) now use
//  THESE tokens instead of the cream ones above. The surfaces are
//  deliberately the same greys the lessons use, so the shell and
//  a lesson feel like the same product — but the brand amber stays
//  the hero accent and bronze stays the kicker colour, which is
//  what keeps this "on-brand" rather than a generic dark theme.
//
//  The cream tokens above are kept intact: Login.jsx and any other
//  page can still opt into the campus look. Dark = the classroom,
//  now extended to the whole climbing route.
// ============================================================
export const DARK = {
  // Surfaces (match the lessons' focus-mode greys)
  bgDeep:       '#0D1117',  // page background — same as lesson <body>
  surface:      '#161B22',  // cards / rows / header bar
  surfaceRaised:'#1C2333',  // hover + elevated panels
  border:       '#30363D',  // hairline borders
  borderSoft:   '#243040',  // even subtler dividers

  // Ink (light, for reading on the dark canvas)
  ink:          '#E6EDF3',  // primary text — same as lesson body text
  inkSoft:      '#C9D1D9',  // secondary body text
  inkMuted:     '#8B949E',  // muted small print / mono captions

  // Accents — the brand, carried onto dark
  amber:        '#E7A13E',  // THE accent (unchanged brand amber)
  amberSoft:    '#F0B860',  // brighter amber for hover / glow
  bronze:       '#C79A5B',  // kickers — brand bronze, lifted for contrast on dark
  blue:         '#58A6FF',  // secondary accent (module rotation), matches lessons

  // Feedback (github-dark tuned, readable on the surfaces above)
  green:        '#3FB950',  // success / completed
  red:          '#F85149',  // errors

  // Deep navy panel (the landing code terminal sits a touch below bgDeep)
  navyPanel:    '#111A2E',
};

export const FONT = "'Space Grotesk', system-ui, sans-serif"; // headings & UI
export const MONO = "'Space Mono', monospace";                // code & kickers
