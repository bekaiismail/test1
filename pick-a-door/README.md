# Pick a Door

A comedy-horror browser game with a story. You are a guest in **the Hallway**, a
corridor where forgotten things end up. Each round the Concierge shows you two
to five doors. Behind them live four groups of residents, each with a story in
three parts. Collect their fragments in your Guest Book, finish all four
chapters, and a door with no plaque appears.

No accounts, no backend, no AI, and no image, audio or video files: all art is
SVG drawn in code and all sound is synthesised in the browser.

## Run it

```bash
npm install
npm run dev      # development server
npm test         # engine tests
npm run build    # type-check and build to dist/
npm run preview  # serve the built game
```

Add `?seed=123` to the URL to make door generation repeatable.

## How the game works

| Rule | Value |
|---|---|
| Doors per round | 2 (50%), 3 (30%), 4 (15%), 5 (5%) |
| Doors per night | 8, then a chapter door if one is due |
| Plaque honesty | 75%; 50% for the rest of a night once you open a lying door |
| The tell | 60% of lying plaques hang crooked; honest plaques never do |
| No-repeat window | An event is not shown again within 4 doors |
| Variety | A resident's chance halves for each visit in the last 3 doors |
| Rare crossovers | 5% when available |

All of these live in `RULES` in `src/game/engine.ts`.

A resident's story advances one part per visit. When all three parts are seen,
that resident's chapter door appears at the end of a night (one chapter per
night). After all four chapters, the next night ends at the unmarked door. Play
continues endlessly afterwards with short "echo" scenes on repeat visits.

## Structure

```
src/
  types.ts               shared types
  App.tsx                screens (menu, hallway, morning) and game flow
  game/
    engine.ts            the Concierge: door generation, event choice, outcomes
    engine.test.ts       tests for every rule in the table above
    rng.ts               seedable random numbers
    storage.ts           versioned LocalStorage save
    audio.ts             Web Audio sound effects and music
  data/
    events.ts            THE EVENT REGISTRY: every scene and its lore
    residents.ts         the four residents
    stamps.ts            achievements
    concierge.ts         the Concierge's lines
  components/
    Door.tsx             a door and its plaque
    EventScene.tsx       plays an event: dialogue, effects, fragment
    Overlays.tsx         scare warning, how to play, settings, Guest Book
  scenes/visuals.tsx     all character artwork (SVG + Framer Motion)
```

## Implemented events (19)

| Resident | Story parts | Chapter |
|---|---|---|
| The Has-Beens (memes) | Greg, Live · The Dance That Got Old · The Catchphrase Parrot | The Last Laugh |
| The Reflection (mirror) | It Does Not Wave Back · Since a Tuesday · That's My Look | Who Left Whom |
| The Unfinished (horror) | The Bottom Half Is Pending · Mid-Chase Since 3:07 · Too Many Teeth | Finish the Dream |
| The Nonsense (absurd) | A Duck of Considerable Size · Chicken, Pursued · This Is Not a Real Crash | The Sense in It |

Plus two rare crossovers (The Duck Consults the Mirror, Greg Opens for a
Nightmare) and the ending (The Unmarked Door).

## Adding a new event

1. Open `src/data/events.ts` and add an object to `EVENTS`:

   ```ts
   {
     id: 'CROSS_003',
     resident: 'nonsense',          // whose door it sits behind
     kind: 'crossover',             // 'story' | 'crossover' | 'chapter' | 'ending'
     title: 'The Duck Files a Complaint',
     description: 'Rare. The duck has notes for the Concierge.',
     visual: 'duck',                // any id from scenes/visuals.tsx
     rarity: 'rare',
     requires: { nonsense: 2 },     // optional: minimum story stage per resident
     lines: [
       { who: 'narrator', text: 'The duck has a clipboard.', pose: 'hat', sfx: 'quack' },
       { who: 'resident', text: 'QUACK. Item one: the plaques.' },
     ],
     echoes: [[{ who: 'resident', text: 'QUACK. Item two.', pose: 'dance' }]],
     fragment: { id: 'frag_x_3', title: 'Clipboard', text: 'Every item is “QUACK.”' },
   }
   ```

2. That is all for a crossover. The engine picks it up, the Guest Book lists its
   fragment, and the tests check its ids are unique.
3. For new artwork, add a component to `scenes/visuals.tsx`, register it in
   `VISUALS`, and add its id to `VisualId` in `types.ts`.

Story events use `kind: 'story'` with `stage: 1 | 2 | 3`; the engine expects
exactly three per resident. Each line can set a `pose`, a sound (`sfx`) and a
screen effect (`fx`: `jumpscare`, `shake`, `dark`, `confetti`, `crash`, `glow`).

## Safety and accessibility

- A warning before the first night lets the player choose scare strength: full,
  mild (no flash, quieter) or off (monsters fade in, no shocks).
- A full scare is one single flash, never a strobe. A limiter caps all volume.
- "Reduce motion" turns off shaking, flashing, looping animation and the typing
  effect. It is on by default when the device asks for reduced motion.
- The fake crash says it is a joke on screen and recovers by itself.
- The mirror is a drawing. The game never uses the camera.
- Every control is a real button and works with the keyboard.

## Deploying

`npm run build` produces a static site in `dist/` that works from any path.

- **Replit:** import the repo, set the run command to `npm run dev`, and for
  deployment choose a Static deployment with build command `npm run build` and
  public directory `dist`. If the repo root is one level up, set the root
  directory to `pick-a-door`.
- **Any static host** (GitHub Pages, Netlify, Vercel, Cloudflare Pages): build
  command `npm run build`, output directory `dist`.

## Known limitations

- The full story takes about five nights (roughly 15 minutes). After that,
  variety comes from echo scenes, the Reflection's random insults and rare
  crossovers; more story content is the main thing to add next.
- Leaving mid-night keeps everything collected so far but restarts the night's
  door count.
- On a 320 px wide phone, a five-door round is slightly taller than the screen
  and scrolls by a few pixels.
- Sound is synthesised, so it is charming rather than realistic.
- Tested in Chromium only; not yet checked in Safari or Firefox.
