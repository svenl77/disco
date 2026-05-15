/**
 * Sprueche pool — what each boy says in different moods.
 *
 * Each boy has their own voice:
 *   pepe     — degen crypto frog
 *   eggplant — $DISCO maxi, pure hype
 *   maus     — serious VC, polished
 *   burns    — rich excellent old-money disco lord
 *   hippie   — peace love disco, cosmic vibes
 *
 * Moods filter the line pool:
 *   idle  — chatter while the music plays
 *   hype  — bigger reaction (after a fill, snare run, etc.)
 *   drop  — fired when DROP is triggered
 *   acid  — when acid disco mode is active
 *   start — first line after PLAY begins
 */
export const SPRUECHE = {
    pepe: {
        idle: [
            'feels good man',
            'gm fren',
            'based',
            'iykyk',
            'sus',
            'cope',
            'wagmi anon',
            'this is fine',
            'lol',
            'kek',
            'down bad',
            'imagine selling',
            'ngmi',
            'comfy',
            'frens we so back',
            'I am the chart',
            'no thoughts head empty',
            'bought the dip',
            'feels disco man',
            'wen lambo',
        ],
        hype: [
            'LFG 🚀',
            'WAGMI',
            'BASED AND DISCO PILLED',
            '100x EZ',
            'APE IN',
            'I AM IN',
            "let's f*ckin go",
            'PEPE LOVES DISCO',
            'PUMP IT',
            'AAAAAAA',
        ],
        drop: ['🚀 TO THE MOON', 'SEND IT', 'KEK 🔥', 'PEPE APPROVES', 'BULLISH ON DISCO'],
        acid: ['acid pilled', '🐸💊', 'reality bending', 'feels weird man', 'green machine'],
        start: ['gm disco', 'pepe is here', 'feels good man', 'frens, we are early'],
    },
    eggplant: {
        idle: [
            '$DISCO INFERNO 🪩',
            'STAYIN ALIVE',
            'I AM the disco',
            'groove or die',
            'boys club forever',
            'every night is friday',
            'good vibes only',
            '🍆 + 🪩 = ❤️',
            'feel the beat',
            'BPM is vibing',
            'we so on chain',
            'I came to dance',
            'the floor is cooking',
            'show me your moves',
            'no thoughts only disco',
            'eggplant maxi',
            'I told you so',
            'this is my era',
            'disco never sleeps',
        ],
        hype: [
            'YESSS',
            'PUMP THE FLOOR',
            'DANCE OR DIE',
            'I AM THE DROP',
            'EVERYBODY DANCE',
            '🪩 EVERYWHERE',
            'BOYS CLUB BABY',
            'TURN IT UP',
        ],
        drop: ['🚀 LFG', '$DISCO INFERNO', 'TO THE MOON', 'STAYIN ALIVE 🪩', 'I LOVE THIS PART'],
        acid: ['🍆 ON ACID', 'colors taste like bass', 'we ascend', 'green disco mode', 'eggplant melting'],
        start: ["let's dance", 'disco engaged', '🪩 booting up', 'the boys are here'],
    },
    maus: {
        idle: [
            'interesting',
            'I am watching',
            'the thesis remains',
            'asymmetric upside',
            "let's look at the chart",
            'we are positioned',
            "I'll be patient",
            'macro is cooked',
            'see you at the top',
            'risk on',
            'narrative shift',
            "I'm bidding",
            'send it',
            'smart money is here',
            'we are early',
            'no edge no trade',
            'the boys can cook',
            'I have a feeling',
            'stay disciplined',
        ],
        hype: [
            'allocate more',
            'this is the trade',
            'fully invested',
            "I'm long disco",
            'maximum conviction',
            'I called this',
        ],
        drop: ['ladies and gentlemen, we got him', 'I priced this in', 'exit pumped', 'told you', 'printing'],
        acid: ['neural network reset', 'algorithmic disco', 'recalibrating', 'data is dancing'],
        start: ['signal received', 'boys are positioned', 'opening bell', "let's review the chart"],
    },
    burns: {
        idle: [
            'excellent...',
            'release the bass',
            'I love this song',
            'splendid',
            'marvelous',
            'rich vibes',
            'I own this floor',
            'release the hounds',
            'champagne and bass',
            'the lights, the lights',
            'I taste the funk',
            'they call me Mr. Disco',
            'sip, dance, repeat',
            'I deserve this beat',
            'vintage disco, exquisite',
            'ahhh, the bass',
            'leverage on disco',
            'the chart is mine',
        ],
        hype: ['MORE COWBELL', 'LOUDER, BOY', 'YES YES YES', 'I COMMAND THE KICK', "DON'T STOP"],
        drop: [
            'splendid drop',
            'magnificent',
            "I'll buy the club",
            'this drop is mine',
            'exquisite low end',
        ],
        acid: ['oh my', 'colors of money', 'I see the rich vibrations', 'gold dust everywhere'],
        start: ['ahhh, finally', 'pour me one', 'shall we dance', 'the night begins'],
    },
    hippie: {
        idle: [
            'peace and love',
            'good energy',
            'groovy',
            'we are all connected',
            'let it flow',
            'the universe is dancing',
            'feel the cosmic beat',
            'we are stardust',
            'be here now',
            '🌈 disco rainbow',
            'soul food',
            'namaste, dance',
            'love thy bass',
            'free your mind',
            'the boys are vibing',
            'om shanti boogie',
            'the cosmos approves',
            "everything's vibration",
        ],
        hype: ['the universe is dancing', 'YES BROTHER', 'COSMIC LOVE', '🌈🌈🌈', 'I FEEL IT', 'WE ARE ONE'],
        drop: ['the cosmos drops', 'we ascended', 'love drop 🌈', 'feel that', '✨ universal love ✨'],
        acid: ['I see the music', 'colors are talking', 'the void is groovy', 'far out, man', '🌈🍄'],
        start: ['namaste fam', 'peace boys', 'good energy incoming', "let's vibe"],
    },
};
const lastShown = {
    pepe: '', eggplant: '', maus: '', burns: '', hippie: '',
};
/** Pick a random sprueche for a boy in a given mood; avoid immediate repeats. */
export function pickSprueche(boy, mood) {
    const pool = SPRUECHE[boy][mood] ?? SPRUECHE[boy].idle;
    const filtered = pool.filter((s) => s !== lastShown[boy]);
    const chosen = (filtered.length ? filtered : pool)[Math.floor(Math.random() * (filtered.length || pool.length))];
    lastShown[boy] = chosen;
    return chosen;
}
