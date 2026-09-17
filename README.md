# Portal to Blues: The Crossroads

A 3D, walkable game for kids about the history of the blues. Explore a
glowing crossroads plaza, walk into six portals — one per era — and
learn the story, key vocabulary, fun facts, and essential songs for
each one. Answer a quick question in each dimension to collect a
"record" for your crate.

## What's new in this version

- **You can actually walk around** — WASD / arrow keys on desktop, an
  on-screen joystick on mobile/touch — instead of just standing still.
- **Glowing shader portals** with a swirling animated energy effect and
  an orbiting sparkle ring, instead of a flat colored circle.
- **A real sky** — a gradient dusk dome, drifting stars, and a glowing
  moon — plus a lone tree and a lantern-topped signpost at the
  crossroads.
- **Floating music notes** drifting up through the plaza, alongside the
  original colored dust.
- **Sound**: footsteps while you walk, a whoosh when you enter a
  portal, a soft ambient hum in each dimension, and chimes for right/
  wrong quiz answers — all built in with no extra files needed (see
  "Optional sound and image files" below to swap in real recordings).
- **3 vocabulary words per era** (was 1), **3 fun facts per era** (new),
  and **6–7 songs per era** (was 3) — nearly 40 songs in total.
- **A short multiple-choice question in each dimension.** Answer it
  correctly to earn a "record" — a little collectible dot in the
  record crate at the top right. Collect all six for a surprise message.
- Progress (which records you've earned) is saved in the browser, so
  it's still there if a kid closes the tab and comes back later.
- Split into multiple files (`index.html`, `css/`, `js/`) instead of one
  giant file, so it's easier for you to edit content or swap assets.

Everything above works right out of the zip file — no images or sounds
required. The optional assets below just make it look and sound even
better.

## How to run it

The simplest way: unzip the folder and double-click `index.html` to
open it in a browser.

For the smoothest experience (especially if you add your own texture
or sound files), serve the folder with a simple local web server
instead of opening the file directly, since some browsers restrict
loading extra files from `file://` URLs:

```
cd portal-to-blues
python3 -m http.server 8000
```

Then open `http://localhost:8000` in a browser.

You can also drag the whole folder into most static-hosting services
(Netlify, GitHub Pages, itch.io, etc.) to publish it online.

## Optional sound and image files

The game already sounds and looks good with **zero** extra files — it
synthesizes sound effects and draws its own textures in code. If you
drop files into the folders below **using these exact names**, the
game will automatically use them instead. Nothing will break if a file
is missing; it just quietly falls back to the built-in version.

### `assets/sounds/` — kid-friendly audio, ideally short and loop-friendly

| File | What it's for | Suggested length |
|---|---|---|
| `plaza-ambient.mp3` | Background ambience while standing in the crossroads plaza (wind, crickets, distant guitar) | 20–60s, loopable |
| `ambient-delta.mp3` | Ambience inside the Delta Blues dimension (porch creaks, cicadas, a lone slide guitar) | 20–60s, loopable |
| `ambient-boogie.mp3` | Ambience for Boogie Woogie & Piedmont (a distant rolling piano) | 20–60s, loopable |
| `ambient-chicago.mp3` | Ambience for Chicago Electric (a low electric guitar hum, city murmur) | 20–60s, loopable |
| `ambient-rnb.mp3` | Ambience for Rhythm & Blues (soft horns, a gentle groove) | 20–60s, loopable |
| `ambient-british.mp3` | Ambience for British Blues Rock (a warm amp hum) | 20–60s, loopable |
| `ambient-modern.mp3` | Ambience for Modern Blues (a modern electric guitar tone) | 20–60s, loopable |
| `portal-whoosh.mp3` | Plays when stepping into or out of a portal | 1–2s |
| `footstep.mp3` | Plays while walking (played repeatedly, so keep it short and not annoying) | under 0.3s |
| `quiz-correct.mp3` | Plays when a kid answers the quiz correctly | 1–2s |
| `quiz-wrong.mp3` | Plays on an incorrect quiz answer — keep this gentle and encouraging, not harsh | 1s |
| `badge-earned.mp3` | Plays when a new record is added to the crate | 1–2s |

These should all be instrumental sound effects or ambient recordings
you have the rights to use — please don't use actual copyrighted blues
recordings for the ambience, since this is meant to point kids toward
the real songs (via the "Listen" links) rather than replace them.
Royalty-free sound libraries like Freesound.org (CC0/CC-BY sounds) or
Pixabay Sound Effects are good sources.

### `assets/textures/` — optional visual upgrades

| File | What it's for |
|---|---|
| `ground-dirt.jpg` | Replaces the flat plaza ground color with a tileable dirt/dust texture (a seamless, fairly dark photo texture works best — it's tiled 12×12 across the ground) |

The portals, sky, and particles are all drawn procedurally with code
(shaders and canvas textures), so they don't need image files — but if
you'd like to experiment, `js/scene.js` has clear comments showing
exactly where a texture could be swapped in.

### `assets/images/`

Not used by the 3D scene itself, but this folder is here if you want
to add a project icon, a printable takeaway sheet, or artwork for
sharing the game elsewhere. Nothing to add here is required.

## Editing the content

All of the words in the game — the story paragraphs, vocabulary,
fun facts, song lists, and quiz questions — live in one place:
`js/data.js`. Add, remove, or edit anything there; the rest of the
game (portals, UI, quiz logic) will pick it up automatically. To add a
7th era/portal, just add another object to the `ERAS` array — the
portal arc, particle colors, and UI all build themselves from that
list.

## A note for grown-ups

Song links open a YouTube search (not a specific video) in a new tab,
so a trusted adult should be nearby to help pick the right result,
since YouTube search results and recommendations aren't curated by
this game.
