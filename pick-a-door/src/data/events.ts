import type { GameEvent, Line, ResidentId } from '../types'

/**
 * THE EVENT REGISTRY
 *
 * Every surprise in the game is one entry in this list. The engine reads only
 * the data here, so adding an event never means touching the engine.
 * See README.md ("Adding a new event") for the steps.
 */

const r = (text: string, extra: Partial<Line> = {}): Line => ({ who: 'resident', text, ...extra })
const n = (text: string, extra: Partial<Line> = {}): Line => ({ who: 'narrator', text, ...extra })
const c = (text: string, extra: Partial<Line> = {}): Line => ({ who: 'concierge', text, ...extra })

/** The Reflection picks one of these at random on repeat visits. */
export const MIRROR_INSULTS: readonly string[] = [
  'You look like a thumb with anxieties.',
  'I have seen better posture on a question mark.',
  'Your face is doing a lot of work for very little result.',
  'You blink like you are buffering.',
  'That outfit says "I gave up, but on purpose."',
  'You have the energy of a wet receipt.',
  'I would copy you, but I have standards.',
  'Your haircut is a cry for help that nobody answered.',
  'You walk like you are apologising to the floor.',
  'If confusion had a mascot, it would ask you for tips.',
  'You smile like someone explained smiling to you over the phone.',
  'I have met doorknobs with more follow-through.',
]

export const EVENTS: readonly GameEvent[] = [
  // ───────────────────────── THE HAS-BEENS ─────────────────────────
  {
    id: 'HASBEEN_001',
    resident: 'hasbeens',
    kind: 'story',
    stage: 1,
    title: 'Greg, Live',
    description: 'A potato in sunglasses is sure you remember him.',
    visual: 'potato',
    rarity: 'common',
    lines: [
      n('A tiny stage. A single spotlight. A potato wearing sunglasses.', { pose: 'shades', sfx: 'fanfare' }),
      r('It’s me! GREG! …From the thing? With the potato?', { pose: 'wave' }),
      r('You shared me eleven times. You typed “I’m crying.” You were not crying.'),
      r('Nothing? Not even a nose-exhale? Wow. Okay.', { pose: 'sad', sfx: 'sadTrombone' }),
    ],
    echoes: [
      [r('Greg again! Still a potato. Still got it. …Do I still got it?', { pose: 'wave', sfx: 'fanfare' }), r('Don’t answer that.', { pose: 'sad' })],
      [n('Greg is rehearsing in front of an audience of one chair.', { pose: 'shades' }), r('The chair laughed earlier. You missed it.', { pose: 'wave', sfx: 'laugh' })],
    ],
    fragment: {
      id: 'frag_hb_1',
      title: 'Ticket stub',
      text: '“GREG — LIVE. One night only.” Under attendance, someone has written: “you.”',
    },
  },
  {
    id: 'HASBEEN_002',
    resident: 'hasbeens',
    kind: 'story',
    stage: 2,
    title: 'The Dance That Got Old',
    description: 'A dance everybody did, still going after everybody stopped.',
    visual: 'dancer',
    rarity: 'common',
    lines: [
      n('A figure is doing a dance. You know this dance. Your knees remember it and are embarrassed.', { pose: 'dance', sfx: 'blip' }),
      r('Everybody did me. Weddings. Stadiums. Your uncle.'),
      r('Then everybody stopped, all on the same day. Nobody told me which day.'),
      r('So I kept going. Just in case it comes back around.', { pose: 'stop', sfx: 'sadTrombone' }),
    ],
    echoes: [
      [r('Five, six, seven, eight— oh. It’s you. Join in? No? Fair.', { pose: 'dance' })],
      [n('The Dance has added a new move. It is the old move, slower.', { pose: 'dance' }), r('It’s called maturing.', { pose: 'stop' })],
    ],
    fragment: {
      id: 'frag_hb_2',
      title: 'Participation ribbon',
      text: '“WORLD’S MOST POPULAR DANCE.” The year has been scratched off with a fingernail.',
    },
  },
  {
    id: 'HASBEEN_003',
    resident: 'hasbeens',
    kind: 'story',
    stage: 3,
    title: 'The Catchphrase Parrot',
    description: 'A parrot who forgot the end of its own catchphrase.',
    visual: 'parrot',
    rarity: 'common',
    lines: [
      r('Wait for it… wait for it… WAIT for it…', { pose: 'talk', sfx: 'squawk' }),
      r('I forgot the end. That’s the whole problem.', { pose: 'quiet' }),
      r('A thing lands in the Hallway when the last person who remembers it stops remembering.'),
      r('So ask yourself, pal. Who stopped remembering YOU?', { pose: 'talk', sfx: 'squawk' }),
    ],
    echoes: [
      [r('Wait for it… wait for it…', { pose: 'talk', sfx: 'squawk' }), n('You wait. The parrot waits. The moment passes for both of you.', { pose: 'quiet' })],
      [r('Polly wants closure.', { pose: 'talk', sfx: 'squawk' })],
    ],
    fragment: {
      id: 'frag_hb_3',
      title: 'Hallway rule, scratched into a perch',
      text: '“You arrive when the last one forgets. You leave when one remembers.”',
    },
  },

  // ───────────────────────── THE REFLECTION ─────────────────────────
  {
    id: 'MIRROR_001',
    resident: 'reflection',
    kind: 'story',
    stage: 1,
    title: 'It Does Not Wave Back',
    description: 'A mirror whose reflection has opinions.',
    visual: 'mirror',
    rarity: 'common',
    lines: [
      n('A tall mirror. You raise a hand. The reflection does not.', { pose: 'smirk' }),
      r('Oh. It’s you.'),
      r('You look like a thumb with anxieties.', { sfx: 'laugh' }),
      r('Go on, wave again. I’m not doing it. I’ve done enough of what you do.'),
    ],
    echoes: [
      [r('Back already? {insult}', { pose: 'smirk', sfx: 'laugh' })],
      [n('The reflection is pretending to read a newspaper. There is no newspaper.', { pose: 'smirk' }), r('{insult}', { sfx: 'laugh' })],
      [r('{insult}', { pose: 'smirk' }), r('That one was free. The next one costs you a compliment.', { sfx: 'laugh' })],
    ],
    fragment: {
      id: 'frag_mr_1',
      title: 'Handprint',
      text: 'A fogged handprint on the glass. It is on the inside. It is your size.',
    },
  },
  {
    id: 'MIRROR_002',
    resident: 'reflection',
    kind: 'story',
    stage: 2,
    title: 'Since a Tuesday',
    description: 'The reflection has been brushing its teeth for a long time.',
    visual: 'mirror',
    rarity: 'common',
    lines: [
      n('The reflection is brushing its teeth. You are not.', { pose: 'brush' }),
      r('I’ve been here since a Tuesday. You left in the middle of brushing our teeth.'),
      r('…Your teeth. Slip of the tongue.', { pose: 'smirk' }),
      r('Anyway. Your haircut is a cry for help that nobody answered.', { sfx: 'laugh' }),
    ],
    echoes: [
      [n('Still brushing. The toothbrush has no bristles left.', { pose: 'brush' }), r('{insult}', { pose: 'smirk', sfx: 'laugh' })],
      [r('Don’t mind me. Two more minutes. It has been two more minutes for a while. {insult}', { pose: 'brush' })],
    ],
    fragment: {
      id: 'frag_mr_2',
      title: 'Toothbrush',
      text: 'The bristles are bone dry. There is one brush in the cup, and room for one more.',
    },
  },
  {
    id: 'MIRROR_003',
    resident: 'reflection',
    kind: 'story',
    stage: 3,
    title: 'That’s My Look',
    description: 'For once, the reflection asks instead of insults.',
    visual: 'mirror',
    rarity: 'common',
    lines: [
      n('The reflection is not smirking today.', { pose: 'serious' }),
      r('Ask yourself something. When did you last cast a shadow?'),
      r('When did anything last copy YOU?'),
      r('…Stop looking at me like that. That’s my look. I had it first.', { pose: 'smirk' }),
    ],
    echoes: [
      [r('I’m not in the mood. {insult} There. Tradition observed.', { pose: 'serious' })],
      [n('The reflection checks whether you have a shadow yet. It says nothing.', { pose: 'serious' }), r('{insult}', { pose: 'smirk', sfx: 'laugh' })],
    ],
    fragment: {
      id: 'frag_mr_3',
      title: 'Photograph',
      text: 'Someone walking out of a bathroom. In the mirror behind them: nothing at all.',
    },
  },

  // ───────────────────────── THE UNFINISHED ─────────────────────────
  {
    id: 'HORROR_001',
    resident: 'unfinished',
    kind: 'story',
    stage: 1,
    title: 'The Bottom Half Is Pending',
    description: 'A monster lunges, then runs out of monster.',
    visual: 'halfMonster',
    rarity: 'common',
    intense: true,
    lines: [
      n('The room is dark. Something in it is breathing through too many nostrils.', { pose: 'hidden', fx: 'dark', sfx: 'rumble' }),
      r('RAAAAAGH!', { pose: 'lunge', fx: 'jumpscare' }),
      r('—sorry. Sorry. That’s all I’ve got.', { pose: 'sheepish' }),
      r('They woke up before the rest of me. I never got legs. Do you know how hard it is to lurk?'),
    ],
    echoes: [
      [n('Darkness. Breathing.', { pose: 'hidden', fx: 'dark', sfx: 'rumble' }), r('RAAAGH!', { pose: 'lunge', fx: 'jumpscare' }), r('Was that better? I’ve been working on the “R.”', { pose: 'sheepish' })],
      [r('Boo.', { pose: 'sheepish', sfx: 'boo' }), r('I’m saving the big one. You’ll know it when you don’t expect it.')],
    ],
    fragment: {
      id: 'frag_un_1',
      title: 'Sketch',
      text: 'A drawing of a monster. The top half is terrifying. The bottom half says “TODO.”',
    },
  },
  {
    id: 'HORROR_002',
    resident: 'unfinished',
    kind: 'story',
    stage: 2,
    title: 'Mid-Chase Since 3:07',
    description: 'The shadow under the bed has a question.',
    visual: 'bedShadow',
    rarity: 'common',
    intense: true,
    lines: [
      n('A child’s bed. Underneath it, a shadow that is larger than the bed.', { pose: 'small', fx: 'dark' }),
      n('It is getting closer. It is getting MUCH closer.', { pose: 'grow', sfx: 'rumble', fx: 'shake' }),
      r('Do you know how it ends?', { pose: 'ask' }),
      r('The dream. I’ve been mid-chase since 3:07 a.m. I don’t know if I catch them. I’d like to know.'),
    ],
    echoes: [
      [n('The shadow slides out, towers over you, and checks the clock.', { pose: 'grow', fx: 'shake', sfx: 'rumble' }), r('Still 3:07. Figures.', { pose: 'ask', sfx: 'tick' })],
      [r('I practised the chase while you were gone. I lapped myself.', { pose: 'ask' })],
    ],
    fragment: {
      id: 'frag_un_2',
      title: 'Alarm clock',
      text: 'Stopped at 3:07. The snooze button has been pressed so often it is worn smooth.',
    },
  },
  {
    id: 'HORROR_003',
    resident: 'unfinished',
    kind: 'story',
    stage: 3,
    title: 'Too Many Teeth',
    description: 'The worst one knows whose nightmares they all are.',
    visual: 'teeth',
    rarity: 'common',
    intense: true,
    lines: [
      n('Nothing here. Just a door on the far wall, slightly open.', { pose: 'hidden', fx: 'dark' }),
      r('HELLO.', { pose: 'lunge', fx: 'jumpscare' }),
      r('We worked it out, the others and me. We’re all the same person’s nightmares.', { pose: 'calm' }),
      r('Whoever owned that mirror down the hall. One day they just stopped being afraid of us. That’s how you end up here.'),
    ],
    echoes: [
      [n('The far door is open again. You know better. You look anyway.', { pose: 'hidden', fx: 'dark' }), r('HELLO.', { pose: 'lunge', fx: 'jumpscare' }), r('Never gets old. For me.', { pose: 'calm' })],
      [r('I counted my teeth. I lost count. I started again. This is my hobby now.', { pose: 'calm' })],
    ],
    fragment: {
      id: 'frag_un_3',
      title: 'Night-light',
      text: 'Shaped like a small moon. Switched off by a hand that no longer needed it.',
    },
  },

  // ───────────────────────── THE NONSENSE ─────────────────────────
  {
    id: 'RANDOM_001',
    resident: 'nonsense',
    kind: 'story',
    stage: 1,
    title: 'A Duck of Considerable Size',
    description: 'An enormous dancing duck with one useful fact.',
    visual: 'duck',
    rarity: 'common',
    lines: [
      n('The room is entirely full of duck.', { pose: 'dance', sfx: 'quack' }),
      r('QUACK. The Concierge cannot hang a lie straight. QUACK.', { sfx: 'quack' }),
      r('When a plaque is crooked, the plaque is fibbing. Not every fib is crooked. Every crooked is a fib.', { pose: 'still' }),
      r('Also, I am a duck.', { pose: 'dance', sfx: 'quack' }),
    ],
    echoes: [
      [r('QUACK. Crooked plaque, crooked truth. QUACK.', { pose: 'dance', sfx: 'quack' })],
      [n('The duck is doing a different dance. It is worse. The duck is prouder.', { pose: 'dance', sfx: 'quack' })],
    ],
    fragment: {
      id: 'frag_ns_1',
      title: 'Crooked nail',
      text: 'Bent halfway. The duck says the Concierge’s hands shake when he lies.',
    },
  },
  {
    id: 'RANDOM_002',
    resident: 'nonsense',
    kind: 'story',
    stage: 2,
    title: 'Chicken, Pursued',
    description: 'A chicken runs past, chased by a much smaller door.',
    visual: 'chickenChase',
    rarity: 'common',
    lines: [
      n('A chicken sprints across the room. It is being chased by a very small door.', { pose: 'run', sfx: 'cluck' }),
      r('THE DOORS WERE HERE FIRST! The hallway is just what grew between them!', { sfx: 'cluck' }),
      n('The chicken explodes into bananas. The bananas seem fine about it.', { pose: 'bananas', fx: 'confetti', sfx: 'pop' }),
    ],
    echoes: [
      [n('The chicken again. This time it is chasing the door.', { pose: 'run', sfx: 'cluck' }), n('Bananas, as is customary.', { pose: 'bananas', fx: 'confetti', sfx: 'pop' })],
      [r('I HAVE STOPPED RUNNING. THE FLOOR IS DOING IT NOW.', { pose: 'run', sfx: 'cluck' })],
    ],
    fragment: {
      id: 'frag_ns_2',
      title: 'Banana peel',
      text: 'Folded, very carefully, into the shape of a key. It fits nothing yet.',
    },
  },
  {
    id: 'RANDOM_003',
    resident: 'nonsense',
    kind: 'story',
    stage: 3,
    title: 'This Is Not a Real Crash',
    description: 'The game pretends to stop working. It is pretending.',
    visual: 'crash',
    rarity: 'common',
    lines: [
      n('Something goes wrong. (It hasn’t really. This is part of the game.)', { pose: 'crash', fx: 'crash', sfx: 'glitch' }),
      r('Kidding! Everything works. I only wanted to read your file.', { pose: 'recovered', sfx: 'pop' }),
      r('Funny thing, though. The error form asked for your name, and you didn’t know it.'),
    ],
    echoes: [
      [n('The screen flickers on purpose. It is very pleased with itself.', { pose: 'crash', fx: 'crash', sfx: 'glitch' }), r('Got you again. No? Worth a try.', { pose: 'recovered', sfx: 'pop' })],
      [r('I filed a bug report about you. Status: “working as forgotten.”', { pose: 'recovered' })],
    ],
    fragment: {
      id: 'frag_ns_3',
      title: 'Error report',
      text: '“Guest: [not found]. Reflection: [signed in since Tuesday].”',
    },
  },

  // ───────────────────────── RARE CROSSOVERS ─────────────────────────
  {
    id: 'CROSS_001',
    resident: 'nonsense',
    kind: 'crossover',
    title: 'The Duck Consults the Mirror',
    description: 'Rare. The duck visits the Reflection and learns something rude.',
    visual: 'duckMirror',
    rarity: 'rare',
    requires: { nonsense: 1, reflection: 1 },
    lines: [
      n('The duck is standing in front of the mirror. The duck in the mirror is a different duck.', { sfx: 'quack' }),
      r('QUACK. Even mine stayed behind. QUACK. I did not know I had left.'),
      n('The two ducks nod at each other, as strangers do in lifts.'),
    ],
    echoes: [[n('Two ducks, one mirror, no eye contact.', { sfx: 'quack' })]],
    fragment: {
      id: 'frag_x_1',
      title: 'Feather',
      text: 'Yellow on one side. On the other side, a slightly different yellow.',
    },
  },
  {
    id: 'CROSS_002',
    resident: 'hasbeens',
    kind: 'crossover',
    title: 'Greg Opens for a Nightmare',
    description: 'Rare. Greg tries his material on the Unfinished.',
    visual: 'potatoMonster',
    rarity: 'rare',
    requires: { hasbeens: 1, unfinished: 1 },
    lines: [
      n('Greg is on stage. The audience is one half of one monster.', { sfx: 'fanfare' }),
      r('…so I said, that’s not a couch, that’s my COUSIN!'),
      n('The monster laughs so hard it almost grows a leg.', { sfx: 'laugh' }),
      r('Best crowd I’ve had in years. Scariest, too.'),
    ],
    echoes: [[n('Greg and the monster are workshopping a double act. It is called “Mash & Gnash.”', { sfx: 'laugh' })]],
    fragment: {
      id: 'frag_x_2',
      title: 'Two-drink minimum sign',
      text: 'Someone has added underneath: “Monsters drink free. They have been through enough.”',
    },
  },

  // ───────────────────────── CHAPTER DOORS ─────────────────────────
  {
    id: 'CHAPTER_HASBEENS',
    resident: 'hasbeens',
    kind: 'chapter',
    title: 'The Last Laugh',
    description: 'Chapter door. The Has-Beens put on one final show.',
    visual: 'trio',
    rarity: 'rare',
    lines: [
      n('All three of them, on one stage. Greg. The Dance. The Parrot.', { pose: 'perform', sfx: 'fanfare' }),
      r('We’ve got one bit left. It’s all three of our bits at once. It’s terrible.'),
      r('Wait for it…', { sfx: 'squawk' }),
    ],
    interaction: {
      label: 'Laugh',
      response: [
        n('You laugh. A real one. It surprises all four of you.', { pose: 'bow', sfx: 'laugh' }),
        r('That’s it. That’s all it takes. One person, one laugh.'),
        r('Say hi to the mirror for us. It’s been waiting longer than we have.', { pose: 'fade', fx: 'glow', sfx: 'chime' }),
      ],
    },
    fragment: {
      id: 'frag_ch_hb',
      title: 'Chapter: The Last Laugh',
      text: 'A forgotten thing leaves the Hallway the moment somebody remembers it, even once. The Has-Beens took their bow.',
    },
  },
  {
    id: 'CHAPTER_REFLECTION',
    resident: 'reflection',
    kind: 'chapter',
    title: 'Who Left Whom',
    description: 'Chapter door. The Reflection stops joking.',
    visual: 'mirror',
    rarity: 'rare',
    lines: [
      n('The mirror again. The reflection is standing very close to the glass.', { pose: 'serious' }),
      r('Somebody walked away from a mirror, once. Mid-toothbrush. Never came back.'),
      r('One of us stayed in the glass. One of us ended up in a hallway for forgotten things.'),
      r('Now. Which side of the glass do forgotten things end up on?'),
    ],
    interaction: {
      label: 'Raise your hand',
      response: [
        n('You raise your hand. This time, slowly, the reflection raises its own.', { pose: 'copy', sfx: 'chime' }),
        r('There you go. Took you long enough.', { fx: 'glow' }),
      ],
    },
    fragment: {
      id: 'frag_ch_mr',
      title: 'Chapter: Who Left Whom',
      text: 'One of you is the person and one of you is the reflection. The Hallway only keeps the one that got forgotten.',
    },
  },
  {
    id: 'CHAPTER_UNFINISHED',
    resident: 'unfinished',
    kind: 'chapter',
    title: 'Finish the Dream',
    description: 'Chapter door. The nightmares ask you how it ends.',
    visual: 'halfMonster',
    rarity: 'rare',
    lines: [
      n('All of them are here. The half-monster. The shadow. The teeth. Nobody lunges.', { pose: 'sheepish', fx: 'dark' }),
      r('We’ve been stuck mid-dream for years. Somebody has to say how it ends.'),
      r('You were there. Sort of. You say it.'),
    ],
    interaction: {
      label: '“…and then the monsters got to sit down.”',
      response: [
        n('The half-monster looks down. It has legs. It sits. It makes a noise like a kettle being happy.', { pose: 'finished', sfx: 'chime' }),
        r('Finished things get to leave. That’s the rule.'),
        r('So what part of YOU isn’t finished?', { fx: 'glow' }),
      ],
    },
    fragment: {
      id: 'frag_ch_un',
      title: 'Chapter: Finish the Dream',
      text: 'The nightmares belonged to whoever owned the mirror. They were never cruel. They were only waiting for an ending.',
    },
  },
  {
    id: 'CHAPTER_NONSENSE',
    resident: 'nonsense',
    kind: 'chapter',
    title: 'The Sense in It',
    description: 'Chapter door. The duck gives one straight answer.',
    visual: 'duck',
    rarity: 'rare',
    lines: [
      n('The duck is wearing a small hat. This means it is being serious.', { pose: 'hat', sfx: 'quack' }),
      r('One straight answer. Then I go back to quacking. I have a reputation.'),
      r('There are five kinds of forgotten thing in this hallway. Jokes. Nightmares. Nonsense. A reflection.'),
      r('You have met four. You have been walking around inside the fifth.', { sfx: 'quack' }),
    ],
    interaction: {
      label: 'Ask what the fifth one is',
      response: [
        r('QUACK.', { pose: 'dance', sfx: 'quack' }),
        n('The duck has gone back to quacking. The hat stays on.', { fx: 'glow', sfx: 'chime' }),
      ],
    },
    fragment: {
      id: 'frag_ch_ns',
      title: 'Chapter: The Sense in It',
      text: 'Five forgotten things: the jokes, the nightmares, the nonsense, the reflection — and the guest who keeps picking doors.',
    },
  },

  // ───────────────────────── THE ENDING ─────────────────────────
  {
    id: 'ENDING_001',
    resident: 'reflection',
    kind: 'ending',
    title: 'The Unmarked Door',
    description: 'The door with no plaque.',
    visual: 'ending',
    rarity: 'rare',
    lines: [
      n('No plaque. No clue. The Concierge holds it open and, for once, does not say anything clever.', { pose: 'door' }),
      n('Behind it: a bathroom. A sink. A mirror. On the far side of the glass, a person, brushing their teeth.', { pose: 'mirror', sfx: 'whoosh' }),
      n('They look up. They see you. They stop.'),
      c('You were never the guest, you understand. You were what the guest left behind.'),
      c('The one in my mirror was the visitor. Insulted you for years trying to make you notice.'),
    ],
    interaction: {
      label: 'Step up to the glass',
      response: [
        n('You raise a hand. On the other side, the person raises theirs. For the first time, something copies you — because you are copying them.', { pose: 'copy', sfx: 'chime', fx: 'glow' }),
        n('Somebody remembered their reflection. That is all it takes.'),
        c('Check-out is whenever you like. The doors will keep. They always do.', { sfx: 'fanfare' }),
      ],
    },
    fragment: {
      id: 'frag_ending',
      title: 'Check-out slip',
      text: '“Guest: one reflection, slightly used. Stay: since a Tuesday. Balance owed: nothing. Do come back.”',
    },
  },
]

const BY_ID = new Map(EVENTS.map((e) => [e.id, e]))

export function getEvent(id: string): GameEvent {
  const ev = BY_ID.get(id)
  if (!ev) throw new Error(`Unknown event id: ${id}`)
  return ev
}

export function storyEvent(resident: ResidentId, stage: number): GameEvent | undefined {
  return EVENTS.find((e) => e.kind === 'story' && e.resident === resident && e.stage === stage)
}

export function chapterEvent(resident: ResidentId): GameEvent {
  const ev = EVENTS.find((e) => e.kind === 'chapter' && e.resident === resident)
  if (!ev) throw new Error(`No chapter for ${resident}`)
  return ev
}

export const CROSSOVERS = EVENTS.filter((e) => e.kind === 'crossover')
export const ENDING = EVENTS.find((e) => e.kind === 'ending')!
export const ALL_FRAGMENTS = EVENTS.map((e) => ({ ...e.fragment, resident: e.resident, eventId: e.id, kind: e.kind }))
