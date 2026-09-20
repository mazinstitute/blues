# Portal to Blues: The Crossroads

A 3D game for kids about the history of the blues, built to run on
shared classroom computers — nothing is ever saved, so every class
period starts from a clean slate automatically. Explore a glowing
crossroads plaza, step through one of six portals — one per era —
and land inside a 3D chamber built around eight glowing **pillars**:
Story, Vocabulary, Match It, Songs, Play It, On the Map, Did-You-Know,
and a quiz that earns you a "record" for your crate. Almost nothing in
this game is a flat menu — the portals, their name plaques, the
pillars, and their icons are all real 3D objects you look at and click
on; the one exception is the small content plaque that pops up next to
a pillar once you click it, since paragraphs of text still need to be
actual, readable HTML.

## What's new in this pass

- **Background characters talk back.** Every villager, dancer, busker,
  and listener filling out the plaza and each era's chamber is now
  clickable. Click one and the camera flies in close on them, they
  stop whatever they were doing (walking, dancing, cheering...) and
  settle into a gentle standing-still breathing pose, and a speech
  bubble appears — first something in character about *why* it's there
  (usually a concert by a real artist from that era), then a funny beat
  where it notices it's being clicked and feels weirdly obligated to
  explain something, then one small, real fact about that era, pulled
  from the same story/facts data the pillars use. Lines are picked at
  random per click (never the same one twice in a row) from
  `CHARACTER_LINES` in `js/data.js` — add more there any time.
  Hovering someone gives them a little bounce so kids notice they're
  clickable; the bubble stays up as long as the reader wants, and a
  **Back** button (bottom centre) — or clicking away — sends the
  camera back out to where they were and lets everyone go about their
  business again. Nothing times out on a slow reader.

- **Speech bubble sits beside the character.** It used to float above
  their head, which ran off the top of the screen once the camera flew
  in close. It now goes to the left or right of whoever you clicked
  (whichever side has more room), with its tail pointing at them, and
  is kept fully on screen.
- **Colorful back buttons.** "Return to Plaza", "Return to Chamber",
  "Back" (while talking to a character) and the quiz's "Change my
  answer" are now filled with the current dimension's color, with a
  brighter gradient in browsers that support `color-mix()`.
- **Session notice.** A slim strip along the top of the screen says
  nothing is saved when you leave the site, so stay on the page. It's
  the `#session-note` element in `index.html`; the chamber bar, HUD and
  hint text are offset by `--note-h` in `css/style.css` to sit below it.

- **Easter egg: caught clipping.** The plaza strollers pace back and
  forth and sometimes wander straight through a bench (or a rock, bush,
  lamp post, tree, or the campfire). Click one while they're inside a
  prop and they skip the usual banter and say something silly about it
  instead, e.g. being interrupted mid quantum-tunnel through a bench.
  Those lines live in `CLIPPING_LINES` in `js/data.js`, keyed by prop
  kind (plus an `any` pool that works for everything), so adding more is
  just adding strings. Which props count is the small footprint list at
  the top of `buildPlazaLife()` in `js/worlds.js`.

- **Brighter and more vibrant, without losing the night-time mood.**
  Ambient and hemisphere light output is up roughly 50–60%, the sky
  gradient, ground, grid, and lantern-post materials all moved a few
  shades lighter and more saturated, and the plaza/chamber point
  lights (portals, lanterns, pillar icons, tree and signpost glow) all
  got a real intensity bump — not just a flat brightness filter. Fog
  density dropped slightly so the plaza's far edges stay visible
  instead of disappearing into haze.
- **A filmic tone-mapping pass.** The renderer now uses ACES filmic
  tone mapping with a touch of extra exposure, which lifts and
  saturates the whole image's midtones — the glowing portals, gems,
  and lantern light all read richer and punchier — while still
  compressing highlights so nothing blows out to flat white.
- **A lighter touch on the vignette.** The cinematic edge-darkening
  overlay is softer now, so it frames the scene without swallowing
  detail at the corners of the screen.

## What's new in this redesign

- **The chamber is a plaza now, not eight markers in a void.** The
  eight functional pillars are unchanged, but the space around them
  is much bigger: a wide outer floor ring, a full circle of 18 glowing
  ambient lantern-posts, and slow-drifting light motes fill the middle
  distance, and the fog is thinner inside the chamber than out in the
  plaza. It reads as an open, lived-in gathering place instead of a
  lonely ring of stones.
- **A brighter, more vibrant palette throughout**, in the same art
  style as before — stronger ambient/fill lighting, higher-saturation
  ground and pillar tinting, and punchier emissive glow on every icon.
- **A living celestial skybox.** The flat two-color gradient is now
  four layers: the gradient dome, a distant spiral galaxy, twinkling
  stars, and a flowing aurora curtain near the horizon — all reading
  live cursor and time values every frame, so the sky visibly drifts
  and shimmers as you move the mouse or look around.
- **The keys-and-black-hole finale is optional, not forced.** Portals
  never lock, even after all six keys and the chest appear — you can
  keep freely revisiting any dimension. The "all six keys" banner now
  offers "Head to the Chest" *or* "Keep Exploring," and opening the
  chest (and the reality-break/black-hole scene beyond it) is a bonus
  scene a player can pursue whenever they like, or skip entirely.
- **The quiz can't be brute-forced.** Two things changed:
  1. **Reading gate.** A dimension's quiz pillar stays visibly
     padlocked until every card in that dimension's Story, Vocabulary,
     and Did-You-Know pillars has actually been flipped and read —
     tracked live, with a checklist showing exactly what's left.
  2. **Two-part answer.** Once unlocked, answering has two steps: pick
     the answer, then confirm which pillar actually proves it (e.g.
     "The Story" vs. "Vocabulary"). A wrong combination never says
     which half was wrong, reshuffles both steps, and adds a short,
     growing cooldown — so clicking through options blind is slower
     and less reliable than just reading the content.

## What was new in the previous overhaul

- **Nothing is saved, on purpose.** This game is meant to run on the
  same handful of shared classroom computers all day, period after
  period. There is no `localStorage`, no cookies, nothing written to
  disk — a student's progress lives only in memory for as long as the
  tab stays open. Reloading the page (which also happens automatically
  once someone finishes the finale below) always hands the next
  student a completely clean slate.
- **A few transitions are snappier.** Portal entry, pillar selection,
  returning to the chamber overview, and the instrument's riff
  playback all move noticeably faster than before, so the game reads
  more like a quick reference kids can dip in and out of between
  activities rather than something that asks them to sit and wait.
- **A finale: collect all six keys, then open the chest.** Once every
  dimension's quiz has been answered correctly, a banner sends the
  player back to the Main Plaza, where a chest has appeared at the
  crossroads. Opening it is a one-way cinematic: the lid pops open,
  the whole plaza is torn apart and pulled into a black hole that
  grows at the center of the scene — portals, the tree, the signpost,
  chunks of the ground itself, all sucked in while the camera shakes
  and the sky drains to black. Once the destruction settles, a final
  multiple-choice question (drawn from the six quiz questions already
  answered) appears. Get it right and the black hole collapses, the
  screen flashes white, and the game reloads — sealed shut, and ready
  for the next student. Get it wrong and it keeps asking, cycling back
  through the same six questions until someone gets one right.
- **Three brand-new pillars, and they're all games, not reading.**
  - **Match It** — a tap-to-pair game: tap a vocabulary word, then tap
    the definition that goes with it. Wrong pairs shake and bounce
    back; a full match earns a little chime.
  - **Play It** — a six-pad instrument built from the same blues
    scale real guitarists and pianists use. Tap pads to play notes, or
    hit "Play a Riff" to hear a short, era-appropriate lick played
    back note-by-note on the pads.
  - **On the Map** — a stylized (not-to-scale) route diagram with
    glowing pins for the real places tied to that era's story. Tap a
    pin to read about it; dashed lines trace the connections back to
    the era's home base.

- **The background hum is gone.** Ambience is file-only now — if you
  drop a real ambience recording into `assets/sounds/` it plays
  softly; if you don't, the game just stays quiet instead of
  synthesizing a drone. Short sound effects (whoosh, clicks, quiz
  chimes, the badge sound, and now a low rumble for the finale) still
  have built-in fallbacks.
- **Portal names no longer overlap.** They used to be flat HTML text
  glued to the screen at a fixed pixel offset, so long titles could
  run into their neighbors. They're real 3D plaques now — mounted in
  the world, with their own background chip and auto-shrinking text —
  so they scale and space themselves with the scene instead of
  overflowing.
- **Completed dimensions look completed.** Once you answer a
  dimension's question correctly, that portal's ring picks up a
  slow-turning gold halo, a small checkmark badge appears above it,
  and its label adds a "Completed" tag — right there in the plaza, so
  you can see your progress before you even step in. You can still
  walk through a completed portal any time to revisit it.
- **Inside is pillars, not a menu page.** Stepping through a portal no
  longer opens one long scrolling page with every section stacked on
  top of each other. It drops you into a small 3D chamber with five
  pillars arranged around you — a spinning torus-knot for the Story,
  a gem for Vocabulary, a stack of spinning records for the Songs, a
  crystal for Did-You-Know, and a question mark (a checkmark once
  you've earned the record) for the Quiz. Click a pillar and the
  camera settles in front of it while a small floating panel opens
  with that pillar's content; close it and you're back looking at all
  five.
- **The songs are the centerpiece.** The Songs pillar sits in the
  middle of the arc and stands taller than the others. Its panel is a
  jukebox-style list where every track is paired with a vocabulary
  term and a fact from that era, so the words and trivia stay tied to
  the music instead of floating in their own separate lists.
- **Everything is still separated by file** (`index.html`, `css/`,
  `js/`) so content, styling, and behavior are easy to find and edit
  independently.

## How to run it

Unzip the folder and double-click `index.html` to open it in a
browser. For the smoothest experience (especially once you add your
own sound or texture files), serve the folder with a simple local web
server instead, since some browsers restrict loading extra files from
`file://` URLs:

```
cd portal-to-blues
python3 -m http.server 8000
```

Then open `http://localhost:8000` in a browser. You can also drag the
whole folder into most static-hosting services (Netlify, GitHub Pages,
itch.io, etc.) to publish it online.

## Optional sound and image files

The game already sounds and looks good with **zero** extra files —
short sound effects are synthesized in code, and the portals, sky, and
particles are all drawn procedurally. If you drop files into the
folders below **using these exact names**, the game will automatically
use them instead. Nothing breaks if a file is missing.

### `assets/sounds/`

| File | What it's for | Suggested length |
|---|---|---|
| `plaza-ambient.mp3` | Background ambience while standing in the crossroads plaza | 20–60s, loopable |
| `ambient-delta.mp3` | Ambience inside the Delta Blues chamber | 20–60s, loopable |
| `ambient-boogie.mp3` | Ambience for Boogie Woogie & Piedmont | 20–60s, loopable |
| `ambient-chicago.mp3` | Ambience for Chicago Electric | 20–60s, loopable |
| `ambient-rnb.mp3` | Ambience for Rhythm & Blues | 20–60s, loopable |
| `ambient-british.mp3` | Ambience for British Blues Rock | 20–60s, loopable |
| `ambient-modern.mp3` | Ambience for Modern Blues | 20–60s, loopable |
| `portal-whoosh.mp3` | Plays when stepping into or out of a portal | 1–2s |
| `quiz-correct.mp3` | Plays when a kid answers the quiz correctly | 1–2s |
| `quiz-wrong.mp3` | Plays on an incorrect quiz answer — keep it gentle | 1s |
| `badge-earned.mp3` | Plays when a new record is added to the crate | 1–2s |

These should be instrumental sound effects or ambient recordings you
have the rights to use — please don't use actual copyrighted blues
recordings for the ambience, since this game is meant to point kids
toward the real songs (via the "Listen" links) rather than replace
them. Royalty-free libraries like Freesound.org (CC0/CC-BY) or Pixabay
Sound Effects are good sources. If a chamber's ambience file is
missing, that chamber is simply quiet — there's no synthesized
substitute anymore.

### `assets/textures/`

| File | What it's for |
|---|---|
| `ground-dirt.jpg` | Replaces the flat plaza ground color with a tileable dirt/dust texture |

### `assets/images/`

Not used by the 3D scene itself — here if you want a project icon or
artwork for sharing the game elsewhere.

## Editing the content

All of the words in the game — the story paragraphs, vocabulary, fun
facts, song lists, quiz questions, instrument riffs, and map pins —
live in one place: `js/data.js`. Add, remove, or edit anything there;
the plaza, the chamber pillars, and the panels all build themselves
from that list. To add a 7th era/portal, just add another object to
the `ERAS` array, including its own `instrument` (name, hint, and a
`riff` array of pad indices 0–5) and `locations` (an array with one
`hub: true` entry plus a couple of connected places, each with a
rough `x`/`y` percent position and a `blurb`). The Match It pillar
needs no extra data — it reuses each era's `vocab` list.

## A note for grown-ups

Song links now go directly to a specific YouTube video for each track
(curated in `js/data.js`), rather than opening a search. A trusted
adult should still be nearby when a student clicks "Listen," since the
game can't control what YouTube shows around that video (recommended
videos, comments, ads, etc.) once it opens.

## Visual overhaul notes

- `js/worlds.js` (new) holds the six unique portal frames, the six unique
  chamber worlds, the plaza's people/props, and the per-world sky presets
  (`WorldKit.SKY`). To retune a world's brightness, edit its preset there.
- Camera distance for the plaza: `plazaCamZ()` in `js/scene.js`.
- Label size/legibility: `makeLabelSprite()` in `js/scene.js`.
- Era colors live in `js/data.js` (six clearly separated hues).

## Maps ("On the Map" panels)

- `js/maps.js` draws each era's map: a simplified basemap (ocean, land,
  lakes, rivers, state lines), routes, and pins placed by real lon/lat.
- To add or move a pin, edit that era's entry in `MAPS` (keyed by era id).
  Pin names must match the `locations[].name` in `js/data.js`.
- Pins on the map show a short name; the full name is in the card below.
