// ============================================================
// PORTAL TO BLUES — DATA
// All the content for each dimension lives here. Nothing else
// in the game needs to change if you just want to edit words,
// add songs, or tweak colors — it all flows from this file.
//
// IMPORTANT: every top-level `const` below (ERAS, CHARACTER_LINES,
// CLIPPING_LINES, PAD_NOTES, PAD_LABELS, FINALE_QUESTIONS) must
// appear exactly ONCE in this file. Declaring one twice is a
// syntax error that stops the whole file from running, which
// leaves the 3D scene black. To add more lines, add strings to
// the existing array instead of pasting in a second copy.
// ============================================================

const ERAS = [
  {
    id: "delta",
    years: "1920s – 1930s",
    name: "Delta Blues",
    color: "#e8a63c",
    blurb: "Where it all began: guitars, porches, and the Mississippi Delta.",
    ambientTrack: "assets/sounds/ambient-delta.mp3",
    instrument: {
      name: "Slide Guitar",
      hint: "Tap the pads to play the six-note blues scale. Delta guitarists like Robert Johnson and Son House slid a glass or metal tube along these same notes to make the guitar 'sing.'",
      riff: [0, 2, 3, 4, 3, 2, 0]
    },
    mapCaption: "A simplified map of where Delta blues took root — not drawn to scale.",
    locations: [
      { name: "Mississippi Delta", x: 30, y: 60, hub: true, blurb: "A flat, fertile farming region between the Mississippi and Yazoo rivers — the heart of this sound." },
      { name: "Dockery Farms", x: 25, y: 55, blurb: "A cotton plantation where musicians including Charley Patton lived and played, passing the style along." },
      { name: "Clarksdale", x: 34, y: 57, blurb: "A Delta town near the legendary crossroads of Highways 61 and 49." }
    ],
    vocab: [
      {
        word: "Call-and-response",
        def: "A musical pattern where one voice or instrument 'calls' out a short line, and another 'answers.' It comes from African traditions and became a backbone of the blues."
      },
      {
        word: "Slide guitar",
        def: "A way of playing guitar where the musician slides a smooth tube (made of glass or metal) along the strings, making the guitar 'sing' and moan almost like a voice."
      },
      {
        word: "Field holler",
        def: "A loud, rhythmic call sung by workers in the fields to pass the time, communicate, or set a work pace. One of the direct ancestors of the blues."
      }
    ],
    history: [
      "The blues took shape in the Deep South in the early 1900s, and the Mississippi Delta became one of its most important homes. It grew out of field hollers, work songs, and spirituals sung by Black farmworkers. Musicians played on porches, at parties, and on street corners, often with just a guitar or a homemade instrument.",
      "Delta blues has a raw, personal sound. Guitarists used a technique called 'slide' — running a bottleneck or metal tube along the strings — to make the guitar moan and cry almost like a human voice.",
      "Artists like Charley Patton, Son House, Robert Johnson, and Blind Willie Johnson made some of the earliest and most influential blues records, laying the foundation for almost every kind of American popular music that came after."
    ],
    facts: [
      "Some Delta blues musicians built their own 'diddley bows' — a single string nailed to a board or a wall — because store-bought guitars were expensive.",
      "The Mississippi Delta isn't a river delta at the coast — it's a flat, fertile farming region between the Mississippi and Yazoo rivers, hundreds of miles from the ocean.",
      "A famous legend says guitarist Robert Johnson met the devil at a crossroads at midnight to learn how to play. It's just a story, but it's why crossroads are such a big symbol in blues history — and why this game is set at one!"
    ],
    songs: [
      { title: "Pony Blues", artist: "Charley Patton", url: "https://www.youtube.com/watch?v=JZ1zOarIoEA" },
      { title: "Walkin' Blues", artist: "Son House", url: "https://www.youtube.com/watch?v=SGcYxUoqVDY" },
      { title: "Cross Road Blues", artist: "Robert Johnson", url: "https://www.youtube.com/watch?v=Kxi4XkIVWLQ" },
      { title: "Dark Was the Night, Cold Was the Ground", artist: "Blind Willie Johnson", url: "https://www.youtube.com/watch?v=BNj2BXW852g" },
      { title: "Match Box Blues", artist: "Blind Lemon Jefferson", url: "https://www.youtube.com/watch?v=JXC1jjRCXtg" },
      { title: "Statesboro Blues", artist: "Blind Willie McTell", url: "https://www.youtube.com/watch?v=fnWxZtI3ONY" },
    ],
    quiz: {
      question: "What does a 'slide' do when a Delta blues guitarist uses one?",
      options: [
        "Slides along the strings to make the guitar moan like a voice",
        "Helps tune the guitar automatically",
        "Makes the guitar louder without an amplifier"
      ],
      correct: 0,
      source: "story"
    }
  },
  {
    id: "boogie",
    years: "1930s – 1940s",
    name: "Boogie Woogie & Piedmont",
    color: "#86c95a",
    blurb: "The blues moves to the piano, and picking styles get fancier out east.",
    ambientTrack: "assets/sounds/ambient-boogie.mp3",
    instrument: {
      name: "Boogie-Woogie Piano",
      hint: "Tap the pads to play the scale. Boogie-woogie pianists rolled a repeating bass pattern with the left hand while the right hand danced across notes like these.",
      riff: [0, 1, 2, 0, 1, 2, 4, 2]
    },
    mapCaption: "A simplified map of where these styles grew — not drawn to scale.",
    locations: [
      { name: "Piedmont Region", x: 70, y: 55, hub: true, blurb: "The rolling hills of the Carolinas and Virginia, home to intricate Piedmont fingerpicking." },
      { name: "Chicago Rent Parties", x: 52, y: 35, blurb: "City apartments where boogie-woogie pianists played to help neighbors cover the month's rent." },
      { name: "Memphis", x: 45, y: 58, blurb: "A crossroads city on the Mississippi River where traveling styles mixed together." }
    ],
    vocab: [
      {
        word: "Boogie-woogie",
        def: "A fast, rolling piano style built on a repeating bass pattern played by the left hand, while the right hand plays a bouncy melody on top."
      },
      {
        word: "Piedmont fingerpicking",
        def: "A guitar style from the Carolinas and Virginia where the thumb keeps a steady beat while the fingers pick out a bouncy, ragtime-influenced melody."
      },
      {
        word: "Juke joint",
        def: "An informal club, often out in the country, where people gathered to dance, eat, and listen to live blues music — usually in a small wooden building."
      }
    ],
    history: [
      "As the blues spread beyond the Delta, two new styles took shape. In cities, piano players developed boogie-woogie: a driving, danceable style built on a rolling bass line that kept a steady beat all by itself.",
      "Out east, in the Carolinas and Virginia, guitarists developed Piedmont blues, a lighter, more intricate fingerpicking style influenced by ragtime, where the thumb keeps a steady beat while the fingers pick out a bouncy melody.",
      "Musicians like Pinetop Smith, Big Bill Broonzy, and Big Maceo Merriweather helped bring the blues into juke joints, rent parties, and eventually onto jukeboxes across the country."
    ],
    facts: [
      "Boogie-woogie's rolling left-hand bass pattern is sometimes called a 'walking bass' because it sounds like it's striding steadily forward.",
      "Rent parties were parties where a struggling family would charge a small entrance fee and hire a piano player — all to help pay the month's rent!",
      "Piedmont fingerpicking influenced generations of folk and rock guitarists, including some of the biggest acoustic guitar players of the 1960s."
    ],
    songs: [
      { title: "Pine Top's Boogie Woogie", artist: "Pinetop Smith", url: "https://www.youtube.com/watch?v=BYrcZp7Pdh8" },
      { title: "Key to the Highway", artist: "Big Bill Broonzy", url: "https://www.youtube.com/watch?v=XY4wnTjnguk" },
      { title: "Worried Life Blues", artist: "Big Maceo Merriweather", url: "https://www.youtube.com/watch?v=8vKHY0sxyZI" },
      { title: "Freight Train", artist: "Elizabeth Cotten", url: "https://www.youtube.com/watch?v=R2DCWfBkMSI" },
    ],
    quiz: {
      question: "In boogie-woogie piano, what does the left hand usually do?",
      options: [
        "Plays a rolling, repeating bass pattern",
        "Stays completely still",
        "Plays the melody while the right hand rests"
      ],
      correct: 0,
      source: "vocab"
    }
  },
  {
    id: "chicago",
    years: "1940s – 1950s",
    name: "Chicago Electric",
    color: "#e2503f",
    blurb: "The blues plugs in and gets loud in the big city.",
    ambientTrack: "assets/sounds/ambient-chicago.mp3",
    instrument: {
      name: "Electric Guitar & Harp",
      hint: "Tap the pads to play the scale — this time with an electric edge. Plugging in let one guitar cut through a loud, crowded club.",
      riff: [0, 3, 4, 5, 4, 3, 0, 3]
    },
    mapCaption: "A simplified map of the Great Migration route — not drawn to scale.",
    locations: [
      { name: "Chicago, Illinois", x: 52, y: 30, hub: true, blurb: "The big city that gave Delta blues an electric plug and a louder voice." },
      { name: "Mississippi Delta", x: 30, y: 60, blurb: "Where many Chicago blues musicians, including Muddy Waters, grew up before heading north." },
      { name: "Chess Records", x: 53, y: 31, blurb: "A small storefront studio on Chicago's South Side that recorded some of the most important blues records ever made." }
    ],
    vocab: [
      {
        word: "Amplifier",
        def: "An electronic device that makes an instrument's sound louder and richer. When Delta blues musicians moved to cities and picked up electric guitars, the amplifier let one guitar cut through a noisy club."
      },
      {
        word: "The Great Migration",
        def: "The movement of millions of Black Americans from the rural South to Northern and Western cities between roughly 1916 and 1970, in search of jobs and a better life."
      },
      {
        word: "Harmonica (harp)",
        def: "A small hand-held wind instrument, often played 'cross harp' style in blues to bend notes and create a wailing, vocal-like tone alongside electric guitar."
      }
    ],
    history: [
      "During the Great Migration, millions of Black Americans moved from the rural South to Northern cities like Chicago looking for work. They brought the blues with them — and in the city, it changed.",
      "To be heard over noisy, crowded clubs, guitarists plugged in. The electric guitar, backed by drums, bass, harmonica, and piano, gave the blues a bigger, punchier sound built for dancing.",
      "Muddy Waters, Howlin' Wolf, and John Lee Hooker became the sound of this new Chicago blues, and their recordings on labels like Chess Records would soon inspire rock and roll musicians around the world."
    ],
    facts: [
      "Chess Records, the famous Chicago blues label, was started by two brothers who ran it out of a small storefront studio.",
      "Muddy Waters' electric slide guitar style directly inspired the name of a very famous British rock band — The Rolling Stones took their name from one of his songs.",
      "Howlin' Wolf was known for his enormous, powerful voice and larger-than-life stage presence — he stood well over six feet tall!"
    ],
    songs: [
      { title: "Smokestack Lightning", artist: "Howlin' Wolf", url: "https://www.youtube.com/watch?v=HTDjD_UdJYs" },
    ],
    quiz: {
      question: "Why did Chicago blues musicians start using electric guitars?",
      options: [
        "To be heard over loud, crowded city clubs",
        "Because acoustic guitars stopped being made",
        "Electric guitars were required by law"
      ],
      correct: 0,
      source: "story"
    }
  },
  {
    id: "rnb",
    years: "1950s – 1960s",
    name: "Rhythm & Blues",
    color: "#e065a8",
    blurb: "Horns, hooks, and heart — the blues gets ready to dance.",
    ambientTrack: "assets/sounds/ambient-rnb.mp3",
    instrument: {
      name: "Horn Section",
      hint: "Tap the pads to play the scale — imagine a trumpet and saxophone playing these notes together in a tight, punchy line.",
      riff: [2, 4, 5, 4, 2, 0, 2, 4]
    },
    mapCaption: "A simplified map of R&B's spread across the country — not drawn to scale.",
    locations: [
      { name: "Memphis, Tennessee", x: 45, y: 58, hub: true, blurb: "A hub where blues, gospel, and swing mixed together into rhythm and blues." },
      { name: "Los Angeles, California", x: 10, y: 48, blurb: "Home to record labels and radio stations that helped spread R&B nationwide." },
      { name: "New York City", x: 78, y: 38, blurb: "A center for R&B recording studios, radio shows, and touring circuits." }
    ],
    vocab: [
      {
        word: "Twelve-bar blues",
        def: "A common musical pattern used in thousands of blues songs, built from twelve 'bars' (measures) of music that repeat in a set pattern of chords."
      },
      {
        word: "Horn section",
        def: "A group of brass and woodwind instruments — like trumpet, saxophone, and trombone — that play punchy, rhythmic parts together to add power to a band's sound."
      },
      {
        word: "Groove",
        def: "The steady, satisfying rhythmic feel a band locks into together, created by the drums, bass, and rhythm guitar or piano working as one unit."
      }
    ],
    history: [
      "By the 1950s, the blues had picked up horns, backup singers, and a smoother, more polished sound. This new mix became known as rhythm and blues, or R&B — music made for dancing as much as listening.",
      "R&B kept the blues' storytelling and its twelve-bar structure, but added catchier hooks and bigger bands. It quickly became the most popular music in Black communities across America.",
      "Artists like B.B. King, Ray Charles, and Etta James became stars, and R&B's mix of blues, gospel, and swing directly set the stage for soul music and rock and roll."
    ],
    facts: [
      "B.B. King named his guitar 'Lucille' and played a Lucille-model guitar for most of his life — every one of his guitars got the same name.",
      "Ray Charles combined blues with gospel church music to help invent a whole new genre: soul music.",
      "Twelve-bar blues is so common that once you learn to hear its pattern, you'll start noticing it in rock, country, and pop songs too."
    ],
    songs: [
      { title: "Every Day I Have the Blues", artist: "B.B. King", url: "https://www.youtube.com/watch?v=E4tL-zeVRbk" },
      { title: "Hit the Road Jack", artist: "Ray Charles", url: "https://www.youtube.com/watch?v=uSiHqxgE2d0" },
      { title: "At Last", artist: "Etta James", url: "https://www.youtube.com/watch?v=S-cbOl96RFM" },
      { title: "The Thrill Is Gone", artist: "B.B. King", url: "https://www.youtube.com/watch?v=oica5jG7FpU" },
      { title: "Stormy Monday", artist: "T-Bone Walker", url: "https://www.youtube.com/watch?v=VAPDJheC0Jk" }
    ],
    quiz: {
      question: "What is 'twelve-bar blues'?",
      options: [
        "A repeating pattern of twelve measures of music used in many blues songs",
        "A blues club with twelve rooms",
        "A guitar with twelve strings"
      ],
      correct: 0,
      source: "vocab"
    }
  },
  {
    id: "british",
    years: "1960s – 1970s",
    name: "British Blues Rock",
    color: "#8b74e6",
    blurb: "Bands across the ocean fall in love with the blues — and turn up the volume.",
    ambientTrack: "assets/sounds/ambient-british.mp3",
    instrument: {
      name: "Electric Guitar Solo",
      hint: "Tap the pads to play the scale. British blues rock guitarists took this same handful of notes and stretched them into long, loud, improvised solos.",
      riff: [0, 2, 4, 5, 4, 2, 5, 0]
    },
    mapCaption: "A simplified map of the trip across the Atlantic — not drawn to scale.",
    locations: [
      { name: "London, England", x: 85, y: 22, hub: true, blurb: "Where young musicians discovered American blues records and formed bands to imitate them." },
      { name: "Liverpool", x: 80, y: 15, blurb: "Another British city buzzing with bands inspired by American blues and rock and roll." },
      { name: "Back Across the Atlantic", x: 55, y: 42, blurb: "British blues rock bands toured the U.S., bringing the sound full circle." }
    ],
    vocab: [
      {
        word: "Blues rock",
        def: "A style that mixes the structure and feeling of blues music with the louder instruments, energy, and attitude of rock and roll."
      },
      {
        word: "Guitar solo",
        def: "A featured section of a song where the guitarist plays a melodic, often improvised passage alone, showing off technique and emotion."
      },
      {
        word: "Cover song",
        def: "A new recording of a song originally performed by a different artist. Many British blues rock bands began by covering American blues songs they loved."
      }
    ],
    history: [
      "In the early 1960s, young musicians in England discovered records by Muddy Waters, Howlin' Wolf, and other American blues artists — and became obsessed. Bands formed just to copy and celebrate that sound.",
      "As these musicians mixed blues with the volume and energy of rock and roll, a new style, blues rock, was born. Guitar solos got longer and louder, and the blues found a whole new, mostly young, audience.",
      "Groups like The Rolling Stones, Fleetwood Mac, and John Mayall's Bluesbreakers (which helped make guitarist Eric Clapton a star) helped send American blues back across the ocean to become a worldwide phenomenon."
    ],
    facts: [
      "Many British blues rock musicians tracked down original American blues records that were hard to find in the UK, trading them like treasure.",
      "Fleetwood Mac started out as a blues band before later becoming famous for a completely different pop-rock sound.",
      "This back-and-forth trip — American blues inspiring British bands, who then became hugely popular back in America — is part of what's called the 'British Invasion' of the 1960s."
    ],
    songs: [
      { title: "Crossroads (live)", artist: "Cream, featuring Eric Clapton", url: "https://www.youtube.com/watch?v=7HfkSzsyh1E" },
      { title: "Oh Well", artist: "Fleetwood Mac", url: "https://www.youtube.com/watch?v=eVrN2E4VHzQ" },
      { title: "All Your Love", artist: "John Mayall's Bluesbreakers", url: "https://www.youtube.com/watch?v=rUUEtCBhn_Q" },
      { title: "Need Your Love So Bad", artist: "Fleetwood Mac", url: "https://www.youtube.com/watch?v=RtmW2ek7WkQ" },
      { title: "Killing Floor", artist: "The Jimi Hendrix Experience", url: "https://www.youtube.com/watch?v=-z4Ue1-jcyo" }
    ],
    quiz: {
      question: "What inspired British blues rock bands in the early 1960s?",
      options: [
        "Records by American blues artists like Muddy Waters and Howlin' Wolf",
        "Music from outer space",
        "Classical symphonies only"
      ],
      correct: 0,
      source: "story"
    }
  },
  {
    id: "modern",
    years: "1980s – Today",
    name: "Modern Blues",
    color: "#3fbfd0",
    blurb: "The tradition keeps evolving in the hands of new generations.",
    ambientTrack: "assets/sounds/ambient-modern.mp3",
    instrument: {
      name: "Modern Blues Guitar",
      hint: "Tap the pads to play the scale — the same blues notes musicians have played for a hundred years, still going strong today.",
      riff: [0, 2, 3, 5, 3, 2, 0, 5]
    },
    mapCaption: "A simplified map of where the blues lives today — not drawn to scale.",
    locations: [
      { name: "Austin, Texas", x: 32, y: 70, hub: true, blurb: "A modern blues hotspot and home turf of guitarist Stevie Ray Vaughan." },
      { name: "Festivals Worldwide", x: 60, y: 20, blurb: "Modern blues festivals now happen everywhere from Mississippi to Norway to Japan." },
      { name: "Right Where You Are", x: 50, y: 88, blurb: "The blues keeps spreading — new artists are playing it in cities everywhere today, maybe even near you." }
    ],
    vocab: [
      {
        word: "Fusion",
        def: "Blending two or more musical styles together to create something new. Modern blues artists often fuse blues with rock, funk, soul, or hip-hop."
      },
      {
        word: "Riff",
        def: "A short, catchy, repeated musical phrase — often played on guitar — that anchors a song and can become instantly recognizable."
      },
      {
        word: "Legacy",
        def: "The musical traditions, techniques, and stories passed down from earlier generations of blues artists to the musicians of today."
      }
    ],
    history: [
      "The blues never stopped growing. In the 1980s, guitarist Stevie Ray Vaughan brought fierce, technical guitar playing back into the spotlight and inspired a whole new wave of blues musicians.",
      "Today's blues artists mix the twelve-bar structure and storytelling of the original Delta blues with rock, funk, soul, and even hip-hop influences, proving the style is still very much alive.",
      "Musicians like Gary Clark Jr. and Joe Bonamassa carry the tradition forward for new audiences, while still tipping their hats to the pioneers who started it all nearly a century ago."
    ],
    facts: [
      "Stevie Ray Vaughan was a huge fan of guitar legend Jimi Hendrix, and he recorded his own version of Hendrix's 'Voodoo Child (Slight Return).'",
      "Modern blues festivals now happen all over the world, from Mississippi to Norway to Japan.",
      "Some modern blues artists mix in turntables, samples, and hip-hop beats — proving the blues can still surprise you a hundred years after it began."
    ],
    songs: [
      { title: "Pride and Joy", artist: "Stevie Ray Vaughan", url: "https://www.youtube.com/watch?v=I3MTGhRC82s" },
      { title: "Texas Flood", artist: "Stevie Ray Vaughan", url: "https://www.youtube.com/watch?v=KC5H9P4F5Uk" },
      { title: "Blues Deluxe", artist: "Joe Bonamassa", url: "https://www.youtube.com/watch?v=w86Jym1eZCI" }
    ],
    quiz: {
      question: "What is 'fusion' in modern blues?",
      options: [
        "Blending blues with other styles like rock, funk, soul, or hip-hop",
        "A type of guitar string",
        "A dance move from the 1920s"
      ],
      correct: 0,
      source: "vocab"
    }
  }
];

// ============================================================
// BACKGROUND CHARACTER LINES
// Every background person in the plaza and inside each dimension's
// chamber can be clicked out of curiosity. Keyed by "plaza" or an
// era id; one line is picked at random per click (never the same
// one twice in a row).
//
// Each list has two groups:
//   1) The first four lines are the "full" pattern: stay in
//      character first (what this person's doing here, tied to a
//      real artist or place from that era), then break the fourth
//      wall about being clicked, then land on one bite-sized fact
//      pulled from that era's own story/facts above.
//   2) The lines after that are extra variety: some carry a fact,
//      some are just for laughs.
// Add more lines to the end of any list. Do NOT paste in a second
// `const CHARACTER_LINES` — this name may only be declared once.
// ============================================================
const CHARACTER_LINES = {
  plaza: [
    // --- Group 1: in character, then a fact ---
    "Oh! Hello there. Yes, I can absolutely tell you're the one clicking on me \u2014 I felt that. I was just enjoying the music drifting out of all six portals at once. Since apparently clicking me makes me talk, here's a fact my programming now insists I share: the crossroads is a huge symbol in blues history, tied to old legends about musicians trading their souls for skill. Neat, right? Anyway, carry on, mysterious clicking presence.",
    "Whoa \u2014 hi! Didn't expect a visitor from beyond the screen. I'm just hanging around the plaza, waiting to head into whichever portal looks fun tonight. But since you clicked me, I am now contractually obligated to inform you: this whole game resets itself once you close it, so nothing that happens here ever gets saved. Kind of makes me a temporary guy. Anyway, nice to meet you, briefly.",
    "Oh, hello! I was just people-watching by the campfire. Fun fact time, since apparently that's a rule now: the word 'blues' comes from an old phrase, 'blue devils,' which used to mean feeling sad or low. Wow, saying that out loud felt oddly formal. Enjoy your visit to the Crossroads!",
    "You \u2014 you can just poke people?? Okay. Well, since I've been poked, here's your fact: each of these six portals leads to a different era of blues history, from the 1920s Mississippi Delta all the way to blues being played somewhere right now. Somewhere. Possibly near you. Spooky. Anyway, bye!",
    // --- Group 2: extra variety ---
    "Oh, hello! I was just trying to decide which portal has the best music tonight. You clicked me, didn't you? Apparently that's my cue to mention that the crossroads became a powerful symbol in blues history, especially in stories about musicians seeking extraordinary skill.",
    "Whoa, you found me! I was just watching everyone wander between the portals like they have somewhere important to be. Since you're apparently collecting conversations now, here's one: the word 'blues' is connected to the old phrase 'blue devils,' meaning feelings of sadness or melancholy.",
    "Hey there! I was just sitting by the fire and enjoying the fact that nobody here has asked me to do anything. And then you clicked me. Incredible timing.",
    "I swear I wasn't doing anything suspicious. I was simply standing here, observing six different eras of blues history through six glowing portals, which is completely normal behavior. Probably.",
    "Oh! You're one of those people who clicks every NPC, aren't you? Fair enough. These portals cover everything from early Delta blues to modern artists still carrying the tradition forward.",
    "I was just listening to all six portals at once, and honestly, my brain has stopped processing music as individual sounds. Also, apparently clicking me means I have to tell you that blues has influenced rock, soul, country, jazz, and a frankly ridiculous amount of modern music.",
    "Hello, mysterious person behind the screen! I'm just passing through the plaza before choosing an era. If you keep clicking people like this, you're going to learn the entire history of blues one confused NPC at a time.",
    "You clicked me. I felt it. I don't know how, but I felt it. Anyway, did you know this whole place is basically one giant musical timeline?",
    "Ah, the plaza! Six portals, one campfire, several confused pedestrians, and absolutely no explanation for why I'm standing here. Sounds historically accurate enough.",
    "Oh, hey! I was wondering which era I'd visit first. Then I remembered I'm an NPC and apparently don't get to choose.",
    "You again? Either this plaza is very small or you're systematically interrogating everyone. Either way, I respect the dedication.",
    "Hello! I was just enjoying the music coming from the Delta portal. Funny how something that began in specific communities and regions eventually traveled around the entire world.",
    "I was going to tell you something interesting, but then you clicked me before I could think of it. So now we're both disappointed.",
    "Hey! Don't mind me, I'm just here enjoying the atmosphere. Six portals, one fire, and a suspicious amount of people who apparently enjoy clicking strangers.",
    "You know, most people just walk through the plaza. You, however, seem determined to interview the population.",
    "I have no idea who built this place, but whoever did apparently thought six portals and a campfire were enough civilization. Honestly? Fair."
  ],

  delta: [
    // --- Group 1: in character, then a fact ---
    "Oh, hello there! I'm just here for tonight's porch concert \u2014 word is Charley Patton himself might play a set. Whoa, hold on, being clicked apparently means I have to tell you something educational now. Huh. Okay: the Mississippi Delta isn't actually a river delta by the ocean \u2014 it's a flat farming region way inland, between the Mississippi and Yazoo rivers. Fascinating. Anyway, enjoy the show.",
    "Hi! Just settling in for some slide guitar under the stars. That's \u2014 wait, did you click me? I suddenly feel very compelled to educate you. Here goes: some Delta musicians built their own 'diddley bows,' a single string nailed to a board, because real guitars cost too much. There. Fact successfully delivered. Please clap.",
    "Oh! Hello, screen-toucher. I was just wondering whether Robert Johnson really met someone at that crossroads at midnight. Since you clicked me, apparently I have to be useful now: that meeting-the-devil story is just a legend, but it's exactly why crossroads are such a big deal in blues history. Fun, huh? Anyway, back to gossiping.",
    "Hey there! Big night \u2014 everyone's buzzing about a Son House set later. Ope, you clicked me, so now I have facts to deliver: 'slide guitar' is just running a smooth glass or metal tube along the strings to make it moan almost like a voice. There. Educational quota: met.",
    // --- Group 2: extra variety ---
    "Oh, hello! I'm just waiting for the porch concert to start. Someone said Charley Patton might be playing tonight, so naturally everyone showed up early.",
    "Hey! I was just listening for a slide guitar somewhere down the road. You clicked me, so here's something neat: the Mississippi Delta is a flat agricultural region between the Mississippi and Yazoo Rivers, not the river's coastal delta.",
    "I'm saving a spot for Son House tonight. The man can make a guitar sound like it's having an argument with the universe.",
    "You startled me! I was just thinking about how some musicians made homemade instruments when store-bought guitars were too expensive. One example is the diddley bow, which uses a single string stretched along a board.",
    "Oh, hi there! I was just sitting outside and waiting for the music to start. You clicked me, so apparently I'm now your unofficial tour guide to the Delta.",
    "Everyone keeps talking about Robert Johnson and that crossroads story. It's a famous legend, but there's no solid evidence that he actually made a supernatural deal there.",
    "Hey! I'm just here for the guitar. Specifically the kind that sounds like somebody taught a wooden box how to cry.",
    "You caught me before the music started! Slide guitar gets its name from using a smooth object along the strings to change their pitch and create that distinctive gliding sound.",
    "I was just watching someone tune a guitar by ear. Meanwhile, I can barely tell whether my shoes are tied correctly.",
    "This place feels quiet until somebody starts playing. Then suddenly the entire porch sounds like it's been waiting all day to speak.",
    "Oh, you're clicking people again. Fine. The Delta became especially important to blues history because musicians there developed styles that influenced generations of later artists.",
    "I was just wondering how anyone managed to play guitar this well without making the neighbors complain. Actually, judging by the volume over there, they probably did.",
    "Hey! Don't step on the porch, that's someone's good spot. Also, if you hear a guitar sliding around, that's probably not the instrument falling apart.",
    "I came here for the music and stayed because nobody has asked me to leave. Honestly, that's a pretty good evening.",
    "Someone just told me there's another guitarist down the road. At this point I'm beginning to suspect this entire region is approximately 80% guitar players."
  ],

  boogie: [
    // --- Group 1: in character, then a fact ---
    "Oh, hi! Just heading to a rent party \u2014 someone hired a piano player to help cover this month's bills. Also, apparently I have to tell you a fact now because you clicked me: that's literally what rent parties were, little dance parties where a family charged an entrance fee just to help make rent. Wow, saying that felt very official. Enjoy the boogie!",
    "Hello! I was just admiring the piano \u2014 this style's called boogie-woogie, all rolling bass lines. Oh, you clicked me, so now I'm required to inform you: that rolling left-hand pattern is sometimes called a 'walking bass,' because it sounds like it's strolling right along. Fact delivered. I'll show myself out.",
    "Oh! Hey there. I'm out here for the Piedmont pickers \u2014 fingerstyle guitar, real fancy stuff. Since you poked me, here's your fact: that thumb-keeps-the-beat, fingers-pick-the-melody style influenced tons of folk and rock guitarists later on. Neat! Anyway, I really must go clap along now.",
    "Hi! Big Bill Broonzy's basically the reason I'm even out tonight. Ope \u2014 clicked. Fact mode engaged: juke joints were informal little clubs, often just small wooden buildings out in the country, where folks gathered to dance and hear live blues. There we go. Carry on.",
    // --- Group 2: extra variety ---
    "Oh, hi! I'm heading to a rent party before all the good seats disappear. These parties helped families raise money for rent while giving everyone an excuse to dance.",
    "Hey! I'm just listening to that piano player absolutely demolish the keys. Boogie-woogie is famous for its repeating left-hand bass patterns while the right hand handles the melody and improvisation.",
    "You clicked me! I was just admiring the pianist's hands. Honestly, they are moving faster than my ability to understand what's happening.",
    "I'm on my way to a Piedmont guitar performance. That fingerstyle approach lets the thumb keep a steady rhythm while the fingers play melodic lines over it.",
    "Oh, hello! I was just trying to figure out how the piano player can keep that bass pattern going without getting tired. I have decided the answer is simply 'pianist magic.'",
    "Everyone's dancing tonight! Somewhere between the piano, guitar, rhythm, and shouting, somebody has apparently decided sitting still is illegal.",
    "You caught me outside the rent party. Don't worry, I'm not late; I'm strategically arriving after the dancing starts.",
    "Hey! That piano sounds like it's running downhill. That's one of the things that makes boogie-woogie so recognizable: the repeating rhythmic bass creates a powerful sense of motion.",
    "I'm just here to hear Big Bill Broonzy. The man could make a guitar sound like it had a personality of its own.",
    "Someone told me there'd be food at the rent party. I've decided this is the most important historical event happening tonight.",
    "Oh, hi! I was practicing keeping time with my foot. Then the piano got faster and my foot filed for retirement.",
    "The guitar players around here can make rhythm and melody happen at the same time. I can barely clap on beat.",
    "You clicked me right as I was about to dance. Excellent timing. Now you get to watch me pretend I wasn't about to dance.",
    "I was just passing through when I heard that piano. Three minutes later, I'm apparently attending a party.",
    "The whole room is moving to that bass line. It's almost like the piano player secretly installed a motor in everyone's feet."
  ],

  chicago: [
    // --- Group 1: in character, then a fact ---
    "Oh, hey! Just grabbing a spot before Muddy Waters plugs in tonight \u2014 it gets loud. Wait, you clicked me?! Apparently that means fact time: his electric slide guitar style actually inspired the name of a very famous British rock band \u2014 The Rolling Stones took their name from one of his songs. Wild, right? Anyway, this club's about to get packed.",
    "Hi there! Word is Howlin' Wolf's playing the storefront tonight. He's extremely tall and extremely loud, which \u2014 oh, you clicked me, guess I owe you a fact now \u2014 is basically why everyone loves him: he stood well over six feet tall with a voice to match. There. Fact secured. See you inside.",
    "Oh, hello! I'm heading down to Chess Records \u2014 tiny storefront studio, huge history. Since you clicked me, apparently I must explain: it was started by two brothers, recording some of the most important blues records ever made out of that little space. Cool, huh? Okay, I really do need to get in line now.",
    "Hey! Big night \u2014 a lot of us just moved up from the South looking for work, and the music followed. Ope, that's my cue apparently: this move is called the Great Migration, and it's a huge reason Chicago blues sounds the way it does. Fact delivered, right on schedule.",
    // --- Group 2: extra variety ---
    "Oh, hey! I'm grabbing a spot before Muddy Waters starts playing. Once that electric guitar kicks in, conversation becomes more of a theoretical concept.",
    "Hi! I was just heading toward Chess Records. It's a small Chicago recording studio with a huge place in the history of electric blues.",
    "You clicked me right before Howlin' Wolf goes on. He's known for a powerful voice and a huge stage presence, so I'm standing somewhere near the back for survival purposes.",
    "A lot of us came north looking for work, and the music came with us. The Great Migration helped connect Southern blues traditions with the growing Chicago music scene.",
    "Hey! I'm waiting for the amplifier to be turned on. I have a feeling this is about to get significantly louder.",
    "You found me outside the club! I'm just listening to the guitars through the wall. Honestly, the wall isn't doing a fantastic job.",
    "Muddy Waters is playing tonight, so everybody showed up early. Apparently word travels faster than I do.",
    "I was just walking toward the studio and nearly got flattened by a musician carrying an amplifier. Chicago blues may be powerful, but apparently the equipment is too.",
    "You clicked me! Fine, here's something useful: electric amplification helped Chicago blues become louder and more suited to crowded clubs and urban audiences.",
    "Chess Records looks tiny from the outside. Then you remember how much music came through that door and suddenly the building feels enormous.",
    "The South had its own sound, Chicago had its own environment, and musicians brought pieces of both together. That's one reason Chicago blues developed such a distinctive character.",
    "I was just watching someone plug in a guitar. Nothing has happened yet, but somehow the room already feels louder.",
    "Hey! Don't stand too close to the speaker. I'm telling you from experience.",
    "You clicked me while I was trying to hear the music through the door. Now I've lost my spot and my dignity.",
    "Someone just said Muddy Waters was playing and the entire street suddenly became a concert venue."
  ],

  rnb: [
    // --- Group 1: in character, then a fact ---
    "Oh, hi! I'm just here early for B.B. King \u2014 heard he's bringing 'Lucille' tonight. Oh, you clicked me \u2014 fine, fact time: he named every single guitar he ever owned 'Lucille,' his whole life. Every one. Anyway, save me a seat up front.",
    "Hello there! Ray Charles is playing later, and honestly I can't wait. Wait, was that a click? Apparently I now must inform you: he mixed blues with gospel church music and helped invent a whole new genre, soul music. There. Fact delivered, mic drop pending.",
    "Oh, hey! Etta James is opening tonight \u2014 'At Last' live is unreal. You clicked me, so: fun fact, this whole style leans on something called twelve-bar blues, a repeating twelve-measure pattern. Once you learn to hear it, you'll notice it everywhere \u2014 rock, country, pop, all of it. Okay, going to find my seat now.",
    "Hi! Big horn section warming up back there \u2014 gets me every time. Ope, clicked, fact incoming: a horn section is usually trumpet, sax, and trombone playing punchy parts together to add real power to the sound. There. Educational duty complete. Enjoy the show!",
    // --- Group 2: extra variety ---
    "Oh, hi! I'm waiting for B.B. King and hoping he brings Lucille. He named his guitar Lucille, and then kept the name for every guitar he played after that.",
    "Hey! Ray Charles is playing later, and I'm already saving my voice for the inevitable singing along. His music blended blues, gospel, jazz, and other influences into a sound that helped shape soul music.",
    "I'm here for Etta James tonight. You clicked me right when I was trying to look cool, so now I'm standing here explaining music history instead.",
    "Oh, hello! That horn section is warming up behind me. Trumpets, saxophones, and trombones can work together to create those huge punchy arrangements you hear in R&B and soul.",
    "You caught me before the show! A lot of R&B grew from blues traditions while incorporating gospel, jazz, and rhythm-driven arrangements.",
    "B.B. King's guitar has more personality than some people I know. That's probably why everyone keeps talking about Lucille.",
    "I was just trying to figure out the twelve-bar blues pattern. Twelve measures later, I realized I had been counting the wrong thing.",
    "Hey! The drummer just started warming up and now the entire building is vibrating. I'm choosing to interpret that as excitement.",
    "You clicked me! Fine, fact time: the twelve-bar blues is a repeating musical structure that became enormously influential far beyond blues itself.",
    "Everyone here seems to have a voice that could knock over a building. Meanwhile, I'm over here trying not to cough during the quiet parts.",
    "I came for the music and accidentally stayed for the horn section. Those things are LOUD.",
    "Oh, hello! I was just listening to someone sing over a blues progression. It's wild how a musical structure that sounds simple can support so much improvisation.",
    "The band is almost ready. I can tell because everyone has suddenly stopped talking and started staring at the stage.",
    "Someone backstage just yelled 'one more minute.' Musicians have apparently discovered the world's most flexible measurement of time.",
    "The whole room is waiting for the first note. I'm beginning to understand why live music feels different from listening to a recording."
  ],

  british: [
    // --- Group 1: in character, then a fact ---
    "Oh, hello! Waiting on a Cream set tonight \u2014 Eric Clapton's playing 'Crossroads' live, which feels a little on the nose for where we are. You clicked me, apparently that means fact time: young British musicians in the '60s got completely obsessed with American blues records and started bands just to copy that sound. There it is. Anyway, tickets are this way.",
    "Hi there! Fleetwood Mac's playing \u2014 funny thing, they actually started out as a straight-up blues band before going full pop-rock later. Oh, you clicked me \u2014 fact obligation activated: many of these bands traded rare American blues records like treasure, since they were so hard to find in the UK. Neat, huh? Okay, doors are opening.",
    "Oh! Hello, mysterious clicker. Big night for John Mayall's Bluesbreakers, the band that helped make Eric Clapton a star. Since you clicked me: fact \u2014 British bands inspired by American blues became hugely popular back in America in the 1960s, a wave people call the 'British Invasion.' There. Duly informed. Enjoy!",
    "Hey! I'm just here early for The Rolling Stones \u2014 massive fans of Muddy Waters, obviously, given the name. Ope, clicked \u2014 fact time: blues rock mixes the structure and feeling of the blues with the volume and energy of rock and roll. Fact secured. See you in there.",
    // --- Group 2: extra variety ---
    "Oh, hello! I'm waiting for Cream to play, and apparently Eric Clapton is bringing 'Crossroads' with him. Considering where we are, that feels almost suspiciously appropriate.",
    "Hi! Fleetwood Mac is playing tonight. They originally began as a blues band before their sound changed dramatically over the years.",
    "I'm here for John Mayall's Bluesbreakers. Young British musicians were digging deeply into American blues records during this era and building bands around what they heard.",
    "You clicked me! Fine, here's the historical explanation: the British blues boom helped introduce American blues influences to huge new audiences through British rock bands.",
    "Hey! Someone backstage is talking about a rare American blues record like it's a priceless treasure. Apparently these records weren't always easy to find in Britain.",
    "The Rolling Stones are playing tonight, and yes, they're huge Muddy Waters fans. Their name itself came from one of his songs.",
    "I was just arguing with someone about which British blues band is loudest. We have made absolutely no progress.",
    "You caught me outside the venue! I'm just waiting for the doors to open before the entire crowd becomes a human traffic jam.",
    "American blues records crossed the Atlantic, British musicians absorbed the sound, and then their bands became internationally famous. Music history is basically a giant game of boomerang.",
    "Hey! The guitar player is tuning backstage. I've heard the same string being adjusted approximately seventeen times.",
    "Cream is about to start. I recommend protecting your ears and your expectations.",
    "I came for the blues and somehow ended up surrounded by teenagers with guitars who look like they haven't slept in three days.",
    "Someone just called this blues rock. Honestly, with that much guitar volume, I think the label has earned its keep.",
    "The audience is already shouting before the band has even walked onstage. This is going to be one of those nights.",
    "You clicked me at exactly the moment I was trying to sneak closer to the stage. Incredible betrayal."
  ],

  modern: [
    // --- Group 1: in character, then a fact ---
    "Oh, hey! Stevie Ray Vaughan tribute set tonight, can't wait. Oh \u2014 you clicked me, that means fact time apparently: he was such a big Jimi Hendrix fan that he recorded his own version of 'Voodoo Child (Slight Return).' Wild, huh? Anyway, doors open soon.",
    "Hi there! Gary Clark Jr.'s headlining \u2014 the tradition's still very much alive. Ope, clicked, fact incoming: modern blues is basically fusion, mixing the original sound with rock, funk, soul, even hip-hop. There. Educational quota met. Enjoy the set!",
    "Oh, hello! Joe Bonamassa's playing later tonight, if you're sticking around. Since you clicked me: fun fact, blues festivals now happen literally all over the world, from Mississippi to Norway to Japan. Cool, right? Anyway, I should grab a good spot.",
    "Hey! Big modern blues night \u2014 proof this sound never really stopped moving. You clicked me, so: fact, some modern blues artists mix in turntables, samples, and hip-hop beats, a hundred years after the whole thing started. There it is. Enjoy yourself!",
    // --- Group 2: extra variety ---
    "Oh, hey! I'm waiting for the Stevie Ray Vaughan tribute set. He was known for his powerful blues guitar style and became one of the most influential modern blues players.",
    "Hi! Gary Clark Jr. is playing tonight, and I'm curious how many different genres he's going to accidentally combine before the first song ends.",
    "I'm here for Joe Bonamassa. Blues festivals now happen all over the world, showing just how far the music traveled from its earlier regional roots.",
    "You clicked me! Fine, modern-blues fact: today's artists can mix blues with rock, funk, soul, jazz, and hip-hop while still keeping recognizable blues elements.",
    "Hey! Someone over there is using samples and electronic sounds with a blues guitar. A hundred years of music history just walked into the same room.",
    "The guitar player just made one note sound emotional. I have been trying to do that with my voice for twenty minutes and have achieved 'confused.'",
    "Oh, hello! I was just listening to a modern blues band. The funny thing about blues is that the instruments and production can change dramatically while the musical ideas keep surviving.",
    "You found me! I'm waiting for the next set to start. Apparently I now have to explain that blues festivals are held in places far beyond the United States, including Europe and Japan.",
    "The stage has three guitarists and approximately twelve thousand pedals. I don't know what any of them do, but they look important.",
    "Hey! That drummer is mixing a blues groove with something that sounds suspiciously like funk. Nobody tell the history books.",
    "I was just wondering how many genres blues has influenced. Then I remembered the answer is basically 'look around.'",
    "You clicked me right as the guitarist was bending a note. That timing was almost cinematic.",
    "Modern blues doesn't have to sound exactly like old blues. That's part of the fun: musicians keep changing the ingredients while carrying pieces of the tradition forward.",
    "Someone backstage just said 'we're going to improvise.' Everyone else immediately looked terrified.",
    "I came here expecting a blues concert and somehow ended up watching someone build a guitar solo using three pedals and pure confidence."
  ]
};

// ============================================================
// EASTER EGG: CLIPPING LINES
// In the plaza, the strollers walk a fixed back-and-forth path and
// sometimes pass straight through a bench, rock, bush, etc. If a kid
// clicks someone while they're inside one of those props, they say one
// of these instead of the usual CHARACTER_LINES banter. Purely for
// laughs: no facts required. Keyed by prop kind (see the collider list
// in buildPlazaLife() in js/worlds.js); "any" lines work for every prop
// and are mixed into each kind's pool. Add as many as you like.
// ============================================================
const CLIPPING_LINES = {
  bench: [
    "Oh no! You caught me during quantum tunneling. Please give me a moment; the bench and I are still negotiating who gets custody of my legs.",
    "Excuse me! I was in the middle of becoming one with the furniture. This is a private moment.",
    "I'm not stuck in the bench. I'm sitting in an extremely advanced way.",
    "The bench and I have reached an understanding. Unfortunately, neither of us understands what that understanding is.",
    "Nobody warned me that benches were solid. This is a shocking development.",
    "I'm not saying I'm a ghost, but the bench seems to agree.",
    "I would like to formally report this bench. I walked toward it and it failed to stop being in my way.",
    "Ah yes, the classic strategy of walking through the furniture instead of around it. Saves approximately three seconds.",
    "Whoa, careful! I'm currently halfway between 'person' and 'furniture accessory.'",
    "The bench is inside me. I'm inside the bench. At this point, we've stopped asking questions.",
    "My knees have disappeared into the bench. If you see them, please return them.",
    "I found a shortcut! It's wooden, confusing, and probably against several laws of physics.",
    "You caught me at a terrible angle. Please pretend this never happened.",
    "I'm not late. I'm in the bench. Those are completely different situations.",
    "Bench! I said excuse me! You don't have to be so dramatic!",
    "Fun fact: the part of me currently inside this bench is deeply embarrassed.",
    "I was attempting to sit down normally. The universe had other plans.",
    "The bench and I are sharing the same coordinates. This is either advanced technology or a bug.",
    "I think the bench has accepted me. I have not yet accepted the bench.",
    "Please don't click me right now. I'm already having a furniture-related crisis."
  ],

  rock: [
    "Oh, hi. I'm inside a rock. It's surprisingly cozy, although the snack situation is terrible.",
    "I'd like to clarify that the rock walked into ME.",
    "I stepped on the rock and simply continued forward. Apparently physics took the afternoon off.",
    "You caught me mid-rock. That's both a pun and a serious problem.",
    "I've always heard rocks are hard. This one seems suspiciously permeable.",
    "If anyone asks, I'm a geological formation now.",
    "This rock is incredibly welcoming. It lets everyone walk straight through it.",
    "I'm not saying I'm the world's smallest mountain, but I do currently contain a person.",
    "The rock and I have become one. I don't know what our shared tax situation looks like.",
    "I was trying to avoid the rock. Unfortunately, I avoided it by entering it.",
    "This is not where I planned to be standing. Technically, I'm not even sure where I'm standing.",
    "I've discovered a new geological layer: me.",
    "The rock is solid, I'm solid, and yet somehow this is happening.",
    "I think I just unlocked Rock Mode.",
    "Please don't tell the geologist."
  ],

  bush: [
    "I'm hiding in a bush. Not on purpose, and apparently not very well.",
    "Why does everyone click people the second they walk through a bush? Is this some kind of social experiment?",
    "Do you mind? I'm currently being a bush with legs.",
    "I meant to walk around the bush. The bush and I had very different plans.",
    "It's surprisingly leafy in here. Two stars, would accidentally enter a bush again.",
    "Shhh! I'm in stealth mode. You ruined everything.",
    "This bush and I are now business partners. We haven't decided what our business is.",
    "I'm not saying I'm part of the landscaping, but if someone gives me a watering can, I won't question it.",
    "I have become one with nature. Nature is apparently full of collision bugs.",
    "You weren't supposed to find me. The bush was supposed to provide better cover.",
    "I'm just going to stay here until someone fixes whatever is happening.",
    "The leaves are tickling me. I have regrets.",
    "If anyone asks, I'm shrubbery. Completely normal shrubbery.",
    "I walked into a bush and discovered a new dimension. Unfortunately, it's mostly leaves.",
    "This is fine. I am definitely not stuck inside decorative vegetation."
  ],

  lamp: [
    "I'm not saying the lamp post is rude, but it hasn't moved over even once.",
    "Please tell the lamp post I'm sorry. It hasn't responded, which is honestly more intimidating.",
    "Do you ever feel like a lamp post is watching you? Especially when you're inside it?",
    "Pole position! Just not the racing kind.",
    "Somebody explain how a skinny pole and I are occupying the exact same space.",
    "I'd say I'm feeling bright, but that's technically the lamp's job.",
    "I was walking normally and suddenly became part of the infrastructure.",
    "The lamp post has claimed me. I fear I may now be considered public property.",
    "This is embarrassing. Please turn off the light so nobody can see me.",
    "I have discovered the secret interior of a lamp post. The secret is apparently 'nothing.'",
    "I don't think I'm supposed to be inside this.",
    "The lamp post and I are sharing a moment. It's mostly confusion.",
    "I tried to walk around it. The game apparently interpreted that as 'walk through it.'",
    "This is not what people mean when they say 'get under the spotlight.'",
    "I would like to leave the lamp post now. It appears to have other plans."
  ],

  campfire: [
    "I'm currently standing in the campfire. It's fine! Everything is completely fine, and I am definitely not questioning reality.",
    "I love a good campfire, especially from the inside.",
    "Marshmallows? Please? I'm already in here.",
    "Fun fact: apparently I am not on fire, which raises several additional questions.",
    "Hot take: standing in a fire is perfectly safe. That was the joke. Please don't test it.",
    "I was trying to get closer to the warmth and accidentally became part of the warmth.",
    "This is either a campfire or an extremely aggressive night-light.",
    "Don't worry, I'm fine. The fire and I have established boundaries.",
    "I'm just standing here casually while the laws of thermodynamics reconsider their career choices.",
    "The fire looks much less intimidating from inside it.",
    "I have achieved maximum campfire proximity.",
    "You know what? I think I'll stand here until someone notices. Oh. You noticed.",
    "I'm not burned, which means the fire is either decorative or I have become incredibly powerful.",
    "Please hand me a marshmallow. I'm already in the marshmallow zone.",
    "Everything is normal. Nobody mention the person standing inside the fire."
  ],

  tree: [
    "I walked directly through a tree trunk. The tree has chosen not to comment.",
    "Hi, I'm inside a tree now. It's dark, woody, and significantly more confusing than I expected.",
    "Trees: one. Me: also one. Location: apparently the exact same place.",
    "That tree has been standing there forever and I just walked through it. I feel like I owe it an apology.",
    "I've become a tree in a very small and deeply inconvenient way.",
    "I'm currently experiencing the ancient art of bark clipping.",
    "I was trying to walk around the tree. The tree apparently had other geometry.",
    "This tree and I have merged our assets. Please respect our privacy.",
    "I'm not trapped. I'm simply exploring the internal architecture of a tree.",
    "I have discovered that trees contain significantly fewer rooms than expected.",
    "The tree is fine. I'm fine. Nobody is fine.",
    "If anyone asks, this is a completely normal way to stand next to a tree.",
    "I have become approximately 40% bark.",
    "The tree didn't move. Neither did I. Somehow, we both won.",
    "I think I'm technically part of the forest now."
  ],

  any: [
    "Excuse me, is there something inside me? I feel like there's something inside me. Oh. It's a prop.",
    "I appear to be inside the scenery. I would like to return to being outside the scenery.",
    "Yes, I'm walking through things. No, I don't know why. Yes, it feels weird.",
    "Shhh. Nobody tell the physics department.",
    "I'm not stuck. I'm simply occupying multiple locations simultaneously.",
    "Objects are only solid if you believe in them, and today I have chosen not to believe.",
    "Quick, act natural. This is completely normal. I'm inside a thing.",
    "Ow! Wait, that didn't hurt at all. That's somehow more concerning.",
    "I have discovered the forbidden technique of ignoring collision.",
    "The scenery and I are currently sharing a very complicated relationship.",
    "Please pretend you didn't see that. I have a reputation to maintain.",
    "I don't think this is how walking works.",
    "The laws of physics have been temporarily suspended for maintenance.",
    "I was promised a normal afternoon. Instead, I am partially inside the environment.",
    "Everything is fine. The geometry is simply having a little disagreement with reality.",
    "I'm not clipping. I'm exploring alternate spatial configurations.",
    "You clicked me at the exact moment I became a polygon.",
    "I have achieved a state of being that scientists will probably describe as 'uh oh.'",
    "The map said this was solid. I have evidence to the contrary.",
    "I would explain how I got here, but frankly, I don't understand it either.",
    "I'm currently standing somewhere that technically shouldn't exist.",
    "Don't worry, I've done this before. Unfortunately, it never makes more sense the second time.",
    "This is not a bug. It's a highly advanced feature that nobody asked for.",
    "I have transcended collision detection. Please clap quietly.",
    "I think I just walked through reality itself. The scenery seems surprisingly okay with it."
  ]
};

// YouTube search helper — used only as a fallback if a song entry
// ever doesn't have its own `url` set.
function ytSearchUrl(title, artist) {
  const q = encodeURIComponent(`${artist} ${title} blues`);
  return `https://www.youtube.com/results?search_query=${q}`;
}

// Shared six-note blues (minor pentatonic) scale used by every era's
// "Play It" instrument pillar — only the instrument name, hint text,
// and riff pattern (indices into this scale) change per era.
const PAD_NOTES = [220.0, 261.63, 293.66, 329.63, 392.0, 440.0];
const PAD_LABELS = ["A", "C", "D", "E", "G", "A"];

// ============================================================
// FINALE — SYNTHESIS QUESTIONS
// The one-last-final-question that appears once the black hole
// finishes tearing the plaza apart. Unlike the six era quizzes
// above (one fact, one chamber), every question here needs
// knowledge from MORE THAN ONE era stitched together — a real
// check that a student's been paying attention the whole way
// through, not just remembering whatever's on the pillar in
// front of them.
//
// One question is picked at random each time the finale starts,
// so different classes/playthroughs may land on a different one.
// Getting it wrong never swaps to a different question — the SAME
// one stays up. Instead, that option locks in as a visible dead
// end (its own little "the world buckles" flavor line) and a hint
// appears, so a wrong guess still moves the player closer to the
// right one instead of starting over.
// ============================================================

const FINALE_QUESTIONS = [
  {
    id: "order",
    question: "The timeline itself is glitching — put these eras back in the order they really happened, earliest to latest, before it locks in wrong forever.",
    options: [
      {
        text: "Delta Blues \u2192 Boogie-Woogie & Piedmont \u2192 Chicago Electric \u2192 British Blues Rock",
        correct: true
      },
      {
        text: "Chicago Electric \u2192 Delta Blues \u2192 British Blues Rock \u2192 Boogie-Woogie & Piedmont",
        failure: "An amplifier crackles to life decades before anyone plugged in a guitar \u2014 the timeline short-circuits and sparks fly across the plaza.",
        hint: "Nobody could plug into an amp before amps reached the blues \u2014 Chicago electrified a sound the Delta had already been playing for years."
      },
      {
        text: "British Blues Rock \u2192 Chicago Electric \u2192 Delta Blues \u2192 Boogie-Woogie & Piedmont",
        failure: "A London stage flickers into view a century early \u2014 the band is covering songs that haven't been written yet, and the plaza groans.",
        hint: "British bands were fans copying American records, so their era has to come after the artists who inspired them."
      },
      {
        text: "Boogie-Woogie & Piedmont \u2192 British Blues Rock \u2192 Delta Blues \u2192 Chicago Electric",
        failure: "A rent-party piano keeps circling back to a riff that was never invented on a Delta porch \u2014 the melody dissolves into static.",
        hint: "The Delta's porches and juke joints came first. Nearly everything else in this story grew out of that starting point."
      }
    ]
  },
  {
    id: "chicago-instrument",
    question: "One sound finally let a single guitarist cut through a loud, crowded Chicago club. Which one \u2014 and from which era?",
    options: [
      { text: "The amplified electric guitar \u2014 Chicago Electric", correct: true },
      {
        text: "A horn section \u2014 Rhythm & Blues",
        failure: "A trumpet blares out of turn and the Chicago chamber's walls buckle inward.",
        hint: "Horns joined the blues a little later, once it picked up a smoother, more danceable sound \u2014 that's a different chamber."
      },
      {
        text: "An unamplified slide guitar \u2014 Delta Blues",
        failure: "The slide guitar keeps sliding, but nobody in the noisy club can hear it \u2014 the sound gets swallowed by the dark.",
        hint: "That's the technique Chicago musicians started with \u2014 but they had to add something to be heard over a crowd."
      },
      {
        text: "A rolling boogie-woogie piano \u2014 Boogie-Woogie & Piedmont",
        failure: "The piano keeps rolling its bass line in the wrong chamber entirely, and the floor cracks beneath it.",
        hint: "That rolling left-hand bass belongs to an earlier, piano-driven chamber \u2014 not the electric one."
      }
    ]
  },
  {
    id: "crossroads-legend",
    question: "Legend says a Delta guitarist met the devil at a midnight crossroads to learn to play \u2014 the very story this place is named for. Who was it?",
    options: [
      { text: "Robert Johnson", correct: true },
      {
        text: "Muddy Waters",
        failure: "Muddy Waters's own portal flickers, its story stolen and pinned to the wrong name.",
        hint: "That musician plugged the Delta sound in up in Chicago \u2014 a different chapter of this story."
      },
      {
        text: "B.B. King",
        failure: "Lucille \u2014 B.B. King's guitar \u2014 falls silent, confused by a legend that was never hers.",
        hint: "That musician's chamber is all about horns, hooks, and dancing \u2014 a later, different era."
      },
      {
        text: "Eric Clapton",
        failure: "A London stage rattles as a legend it never claimed gets bolted onto its story.",
        hint: "That guitarist grew up listening to American blues records \u2014 he came generations after the crossroads legend began."
      }
    ]
  },
  {
    id: "great-migration",
    question: "The Great Migration carried the Delta sound north. Which city did it land in, and what changed once it got there?",
    options: [
      { text: "Chicago \u2014 the guitar went electric", correct: true },
      {
        text: "London \u2014 the guitar went electric",
        failure: "A ship sets sail for the wrong ocean, and the Great Migration's map tears down the middle.",
        hint: "The Great Migration moved within the United States, from the rural South to Northern cities \u2014 London enters this story much later, and differently."
      },
      {
        text: "Memphis \u2014 horns joined the band",
        failure: "A horn section starts playing on a migration route that never passed through it.",
        hint: "Horns and a smoother sound belong to a later chapter \u2014 this migration was about guitars getting louder, not horns joining in."
      },
      {
        text: "Austin \u2014 the tradition kept going today",
        failure: "A modern blues festival poster appears decades too soon, advertising to a crowd that doesn't exist yet.",
        hint: "That city's chapter is about blues today, not about the migration that first carried it north."
      }
    ]
  },
  {
    id: "muddy-rolling-stones",
    question: "One Chicago blues song's title became the name of a massively famous British band \u2014 and that whole scene grew out of records like it. Whose song was it?",
    options: [
      { text: "Muddy Waters", correct: true },
      {
        text: "Robert Johnson",
        failure: "A crossroads sign spins in place, pointing every direction at once.",
        hint: "That legend belongs to the Delta \u2014 the song that became a British band's name came from a musician who'd already plugged in."
      },
      {
        text: "B.B. King",
        failure: "Lucille strums a chord that doesn't fit this song at all, and the note hangs sour in the air.",
        hint: "That musician's chamber is about rhythm and blues, not the Chicago recordings British bands were obsessed with."
      },
      {
        text: "Howlin' Wolf",
        failure: "A towering silhouette looms in the wrong chamber, six feet of voice with nowhere to sing it.",
        hint: "Close \u2014 same Chicago chamber \u2014 but it's a different artist whose song title actually became the band's name."
      }
    ]
  },
  {
    id: "piedmont-fingerpicking",
    question: "Which era's guitarists kept a steady beat with their thumb while their fingers picked out a bouncy, ragtime-flavored melody?",
    options: [
      { text: "Boogie-Woogie & Piedmont", correct: true },
      {
        text: "Delta Blues",
        failure: "A glass slide clatters uselessly off strings it was never meant to touch.",
        hint: "The Delta's signature technique was the slide, not fingerpicking \u2014 think one hand sliding, not two hands working independently."
      },
      {
        text: "Rhythm & Blues",
        failure: "A horn section tries to fingerpick and simply cannot \u2014 brass has no strings.",
        hint: "That chamber is built around horns and hooks, not intricate guitar fingerpicking."
      },
      {
        text: "Modern Blues",
        failure: "A festival banner unfurls a hundred years too late for this particular guitar style.",
        hint: "This fingerpicking style is much older \u2014 it grew up alongside boogie-woogie piano, out in the Carolinas and Virginia."
      }
    ]
  },
  {
    id: "srv-tribute",
    question: "Stevie Ray Vaughan brought the blues roaring back in the 1980s, and he recorded his own version of 'Voodoo Child (Slight Return)' as a tribute. Whose song was it \u2014 a guitarist who also shows up in the British Blues Rock chamber?",
    options: [
      { text: "Jimi Hendrix", correct: true },
      {
        text: "Eric Clapton",
        failure: "A guitar solo stretches on and on, honoring no one in particular, and the note never resolves.",
        hint: "That guitarist's own band is part of the British Blues Rock story \u2014 but 'Voodoo Child' isn't his song. Check the song list in that chamber for another name."
      },
      {
        text: "Muddy Waters",
        failure: "An amplifier hums, unclaimed, waiting for a tribute that was never meant for it.",
        hint: "That musician belongs to an earlier, electric-guitar chamber \u2014 not the one built around British bands falling in love with American blues."
      },
      {
        text: "B.B. King",
        failure: "Lucille waits patiently for a tribute that isn't hers to receive.",
        hint: "Right instrument, wrong musician \u2014 and wrong era. Think about who shows up in the British Blues Rock song list."
      }
    ]
  }
];

// ============================================================
// SAFETY NET: DATA CHECK
// Runs once when the file loads and only prints warnings to the
// browser console (F12). It never stops the game. It can't catch
// a syntax error (nothing can — the browser skips the whole file),
// but it does catch the sneaky content mistakes that would
// otherwise fail quietly: a quiz answer pointing at a missing
// option, a riff note that doesn't exist, a missing map hub, an
// era with no character lines, or a finale question with no (or
// more than one) correct answer.
// ============================================================
(function checkGameData() {
  try {
    const problems = [];
    const needs = ["id", "years", "name", "color", "blurb", "instrument", "locations", "vocab", "history", "facts", "songs", "quiz"];

    ERAS.forEach(function (era) {
      const tag = "ERAS[" + (era.id || "?") + "]";
      needs.forEach(function (key) {
        if (!era[key]) problems.push(tag + " is missing '" + key + "'");
      });
      if (era.quiz && era.quiz.options && (era.quiz.correct < 0 || era.quiz.correct >= era.quiz.options.length)) {
        problems.push(tag + " quiz.correct points at an option that doesn't exist");
      }
      if (era.instrument && era.instrument.riff) {
        era.instrument.riff.forEach(function (pad) {
          if (pad < 0 || pad >= PAD_NOTES.length) problems.push(tag + " riff uses pad " + pad + ", but pads only go 0-" + (PAD_NOTES.length - 1));
        });
      }
      if (era.locations) {
        const hubs = era.locations.filter(function (loc) { return loc.hub; }).length;
        if (hubs !== 1) problems.push(tag + " should have exactly one location with hub: true (found " + hubs + ")");
      }
      if (!Array.isArray(CHARACTER_LINES[era.id]) || CHARACTER_LINES[era.id].length === 0) {
        problems.push("CHARACTER_LINES has no lines for '" + era.id + "'");
      }
    });

    if (!Array.isArray(CHARACTER_LINES.plaza) || CHARACTER_LINES.plaza.length === 0) {
      problems.push("CHARACTER_LINES has no 'plaza' lines");
    }
    Object.keys(CLIPPING_LINES).forEach(function (kind) {
      if (!Array.isArray(CLIPPING_LINES[kind]) || CLIPPING_LINES[kind].length === 0) {
        problems.push("CLIPPING_LINES['" + kind + "'] is empty");
      }
    });
    FINALE_QUESTIONS.forEach(function (q) {
      const correctCount = q.options.filter(function (o) { return o.correct; }).length;
      if (correctCount !== 1) problems.push("FINALE_QUESTIONS['" + q.id + "'] has " + correctCount + " correct answers (needs exactly 1)");
    });

    if (problems.length) {
      console.warn("[Portal to Blues] data.js check found " + problems.length + " problem(s):\n - " + problems.join("\n - "));
    }
  } catch (err) {
    console.warn("[Portal to Blues] data.js check couldn't finish:", err);
  }
})();
