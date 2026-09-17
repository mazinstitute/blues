// ============================================================
// PORTAL TO BLUES — DATA
// All the content for each dimension lives here. Nothing else
// in the game needs to change if you just want to edit words,
// add songs, or tweak colors — it all flows from this file.
// ============================================================

const ERAS = [
  {
    id: "delta",
    years: "1920s – 1930s",
    name: "Delta Blues",
    color: "#f2b447",
    blurb: "Where it all began: guitars, porches, and the Mississippi Delta.",
    ambientTrack: "assets/sounds/ambient-delta.mp3",
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
      "The blues began in the Mississippi Delta in the early 1900s, growing out of field hollers, work songs, and spirituals sung by Black farmworkers. Musicians played on porches, at parties, and on street corners, often with just a guitar or a homemade instrument.",
      "Delta blues has a raw, personal sound. Guitarists used a technique called 'slide' — running a bottleneck or metal tube along the strings — to make the guitar moan and cry almost like a human voice.",
      "Artists like Charley Patton, Son House, Robert Johnson, and Blind Willie Johnson recorded some of the very first blues songs ever put on record, laying the foundation for almost every kind of American popular music that came after."
    ],
    facts: [
      "Some Delta blues musicians built their own 'diddley bows' — a single string nailed to a board or a wall — because store-bought guitars were expensive.",
      "The Mississippi Delta isn't a river delta at the coast — it's a flat, fertile farming region between the Mississippi and Yazoo rivers, hundreds of miles from the ocean.",
      "A famous legend says guitarist Robert Johnson met the devil at a crossroads at midnight to learn how to play. It's just a story, but it's why crossroads are such a big symbol in blues history — and why this game is set at one!"
    ],
    songs: [
      { title: "Pony Blues", artist: "Charley Patton" },
      { title: "Walkin' Blues", artist: "Son House" },
      { title: "Cross Road Blues", artist: "Robert Johnson" },
      { title: "Dark Was the Night, Cold Was the Ground", artist: "Blind Willie Johnson" },
      { title: "Match Box Blues", artist: "Blind Lemon Jefferson" },
      { title: "Statesboro Blues", artist: "Blind Willie McTell" },
      { title: "Goodnight, Irene", artist: "Lead Belly" }
    ],
    quiz: {
      question: "What does a 'slide' do when a Delta blues guitarist uses one?",
      options: [
        "Slides along the strings to make the guitar moan like a voice",
        "Helps tune the guitar automatically",
        "Makes the guitar louder without an amplifier"
      ],
      correct: 0
    }
  },
  {
    id: "boogie",
    years: "1930s – 1940s",
    name: "Boogie Woogie & Piedmont",
    color: "#e2842a",
    blurb: "The blues moves to the piano, and picking styles get fancier out east.",
    ambientTrack: "assets/sounds/ambient-boogie.mp3",
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
      { title: "Pine Top's Boogie Woogie", artist: "Pinetop Smith" },
      { title: "Key to the Highway", artist: "Big Bill Broonzy" },
      { title: "Worried Life Blues", artist: "Big Maceo Merriweather" },
      { title: "Roll 'Em Pete", artist: "Pete Johnson & Big Joe Turner" },
      { title: "Freight Train", artist: "Elizabeth Cotten" },
      { title: "Candy Man", artist: "Rev. Gary Davis" }
    ],
    quiz: {
      question: "In boogie-woogie piano, what does the left hand usually do?",
      options: [
        "Plays a rolling, repeating bass pattern",
        "Stays completely still",
        "Plays the melody while the right hand rests"
      ],
      correct: 0
    }
  },
  {
    id: "chicago",
    years: "1940s – 1950s",
    name: "Chicago Electric",
    color: "#e2572a",
    blurb: "The blues plugs in and gets loud in the big city.",
    ambientTrack: "assets/sounds/ambient-chicago.mp3",
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
      { title: "Hoochie Coochie Man", artist: "Muddy Waters" },
      { title: "Boom Boom", artist: "John Lee Hooker" },
      { title: "Bright Lights, Big City", artist: "Jimmy Reed" },
      { title: "Smokestack Lightning", artist: "Howlin' Wolf" },
      { title: "Rollin' Stone", artist: "Muddy Waters" },
      { title: "Mannish Boy", artist: "Muddy Waters" }
    ],
    quiz: {
      question: "Why did Chicago blues musicians start using electric guitars?",
      options: [
        "To be heard over loud, crowded city clubs",
        "Because acoustic guitars stopped being made",
        "Electric guitars were required by law"
      ],
      correct: 0
    }
  },
  {
    id: "rnb",
    years: "1950s – 1960s",
    name: "Rhythm & Blues",
    color: "#c98f2a",
    blurb: "Horns, hooks, and heart — the blues gets ready to dance.",
    ambientTrack: "assets/sounds/ambient-rnb.mp3",
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
      { title: "Every Day I Have the Blues", artist: "B.B. King" },
      { title: "Hit the Road Jack", artist: "Ray Charles" },
      { title: "At Last", artist: "Etta James" },
      { title: "The Thrill Is Gone", artist: "B.B. King" },
      { title: "What'd I Say", artist: "Ray Charles" },
      { title: "Stormy Monday", artist: "T-Bone Walker" }
    ],
    quiz: {
      question: "What is 'twelve-bar blues'?",
      options: [
        "A repeating pattern of twelve measures of music used in many blues songs",
        "A blues club with twelve rooms",
        "A guitar with twelve strings"
      ],
      correct: 0
    }
  },
  {
    id: "british",
    years: "1960s – 1970s",
    name: "British Blues Rock",
    color: "#8a6ad8",
    blurb: "Bands across the ocean fall in love with the blues — and turn up the volume.",
    ambientTrack: "assets/sounds/ambient-british.mp3",
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
      "Groups like The Rolling Stones, Fleetwood Mac, and John Mayall's Bluesbreakers (which launched guitarist Eric Clapton's career) helped send American blues back across the ocean to become a worldwide phenomenon."
    ],
    facts: [
      "Many British blues rock musicians tracked down original American blues records that were hard to find in the UK, trading them like treasure.",
      "Fleetwood Mac started out as a blues band before later becoming famous for a completely different pop-rock sound.",
      "This back-and-forth trip — American blues inspiring British rock, which then became hugely popular back in America — is sometimes called the 'British Invasion.'"
    ],
    songs: [
      { title: "Crossroads (live)", artist: "Cream, featuring Eric Clapton" },
      { title: "Oh Well", artist: "Fleetwood Mac" },
      { title: "All Your Love", artist: "John Mayall's Bluesbreakers" },
      { title: "Spoonful", artist: "Cream" },
      { title: "Need Your Love So Bad", artist: "Fleetwood Mac" },
      { title: "Killing Floor", artist: "The Jimi Hendrix Experience" }
    ],
    quiz: {
      question: "What inspired British blues rock bands in the early 1960s?",
      options: [
        "Records by American blues artists like Muddy Waters and Howlin' Wolf",
        "Music from outer space",
        "Classical symphonies only"
      ],
      correct: 0
    }
  },
  {
    id: "modern",
    years: "1980s – Today",
    name: "Modern Blues",
    color: "#3ab0a8",
    blurb: "The tradition keeps evolving in the hands of new generations.",
    ambientTrack: "assets/sounds/ambient-modern.mp3",
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
      "Stevie Ray Vaughan learned to play left-handed guitars strung backwards, in tribute to Jimi Hendrix — but he actually played right-handed.",
      "Modern blues festivals now happen all over the world, from Mississippi to Norway to Japan.",
      "Some modern blues artists mix in turntables, samples, and hip-hop beats — proving the blues can still surprise you a hundred years after it began."
    ],
    songs: [
      { title: "Pride and Joy", artist: "Stevie Ray Vaughan" },
      { title: "Bright Lights", artist: "Gary Clark Jr." },
      { title: "Sloe Gin", artist: "Joe Bonamassa" },
      { title: "Texas Flood", artist: "Stevie Ray Vaughan" },
      { title: "This Land", artist: "Gary Clark Jr." },
      { title: "Blues Deluxe", artist: "Joe Bonamassa" }
    ],
    quiz: {
      question: "What is 'fusion' in modern blues?",
      options: [
        "Blending blues with other styles like rock, funk, soul, or hip-hop",
        "A type of guitar string",
        "A dance move from the 1920s"
      ],
      correct: 0
    }
  }
];

// YouTube search helper — opens a search rather than a specific video,
// since specific links can go dead or change over time.
function ytSearchUrl(title, artist) {
  const q = encodeURIComponent(`${artist} ${title} blues`);
  return `https://www.youtube.com/results?search_query=${q}`;
}
