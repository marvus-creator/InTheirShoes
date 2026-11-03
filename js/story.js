const PEOPLE = {
  you: { name: null, skin: '#7f4f31', hair: 'short', hairColor: '#1a1210', shirt: '#3d6fb6', color: '#e0703c' },
  eric: { name: 'Eric', skin: '#5f3820', hair: 'short', hairColor: '#120c09', shirt: '#3d6fb6', color: '#2f8f83' },
  diane: { name: 'Diane', skin: '#8d5a3b', hair: 'puff', hairColor: '#1b120d', shirt: '#3d6fb6', color: '#b0569b' },
  mama: { name: 'Mama', skin: '#6e4229', hair: 'wrap', hairColor: '#d9902f', shirt: '#9c3d54', color: '#c0613b' },
  keza: { name: 'Keza', skin: '#7a4a2e', hair: 'bunches', hairColor: '#160f0b', shirt: '#e58aa6', color: '#d9668a' },
  teacher: { name: 'Mrs. Uwase', skin: '#86532f', hair: 'bun', hairColor: '#1a120e', shirt: '#4d8a5a', color: '#4d8a5a' },
  grace: { name: 'Grace', skin: '#94603f', hair: 'braids', hairColor: '#1a110c', shirt: '#3d6fb6', color: '#7d5bc4' },
  ines: { name: 'Ines', skin: '#a06a46', hair: 'puff', hairColor: '#2a1a12', shirt: '#3d6fb6', color: '#c78a1e' },
  kevin: { name: 'Kevin', skin: '#5a3521', hair: 'short', hairColor: '#0f0a08', shirt: '#3d6fb6', color: '#3f74c9' },
};

const CHAPTERS = [
  {
    id: 'late',
    title: 'The Late One',
    other: 'eric',
    skill: 'Empathy',
    you: [
      { bg: 'classroom', chalk: 'Group projects: Clean water', time: 'Monday · 7:45' },
      { cast: [{ id: 'diane', mood: 'angry' }, { id: 'eric', mood: 'tired' }] },
      { narr: 'Your group presents today. Eric runs in late. Wet shirt. No poster.' },
      { say: 'eric', mood: 'sad', text: 'I’m sorry. I didn’t finish it.' },
      {
        choose: [
          { text: '“Seriously? You always do this.”' },
          { text: 'Say nothing. Turn away.' },
          { text: '“Okay. What can you still do?”' },
        ],
        save: 'c1a',
      },
      { judge: { q: 'Be honest. What do you think about Eric?', options: ['He’s lazy.', 'He doesn’t care about us.', 'Something might be wrong.'] }, save: 'c1j' },
      { switch: 'eric', text: 'Same morning. Now you are Eric.' },
    ],
    them: [
      { bg: 'dawn', time: 'Monday · 5:10' },
      { cast: [{ id: 'mama', mood: 'worried' }] },
      { say: 'mama', mood: 'worried', text: 'Eric, the tap is dry. We need water before school.' },
      { bg: 'waterpoint', time: 'Monday · 5:40' },
      { cast: [] },
      { narr: 'Two kilometres to the water point. Twenty people in the queue.' },
      { bg: 'home', time: 'Monday · 7:00' },
      { cast: [{ id: 'keza', mood: 'worried' }] },
      { say: 'keza', mood: 'worried', text: 'Eric, walk me to school? The big road scares me.' },
      { bg: 'classroom', chalk: 'Group projects: Clean water', time: 'Monday · 7:45' },
      { cast: [{ id: 'diane', mood: 'angry' }, { id: 'you', mood: 'neutral' }] },
      {
        when: 'c1a',
        cases: [
          [{ say: 'you', mood: 'angry', text: 'Seriously? You always do this.' }, { think: 'They think I don’t care. I care so much.' }],
          [{ mood: ['you', 'angry'] }, { narr: '{name} turns away.' }, { think: 'Nobody even looks at me.' }],
          [{ say: 'you', mood: 'neutral', text: 'Okay. What can you still do?' }, { think: 'Someone still wants me here.' }],
        ],
      },
      {
        card: {
          thought: '{c1j}',
          judged: 'c1j',
          truth: 'Eric fetched water for his family, then walked his little sister across the big road.',
          lesson: 'Before you judge, ask: what can’t I see?',
        },
      },
      { back: true, text: 'Back to you. Same moment. Now you know.' },
    ],
    back: [
      { bg: 'classroom', chalk: 'Group projects: Clean water', time: 'Monday · 7:45' },
      { cast: [{ id: 'diane', mood: 'worried' }, { id: 'eric', mood: 'tired' }] },
      {
        choose: [
          { text: '“Are you okay? You look exhausted.”', then: [{ say: 'eric', mood: 'happy', text: 'Thank you for asking. Long morning.' }] },
          { text: '“Let’s finish it together, right now.”', then: [{ say: 'eric', mood: 'happy', text: 'Really? Thank you.' }] },
        ],
      },
      { cast: [{ id: 'diane', mood: 'happy' }, { id: 'eric', mood: 'happy' }] },
      { narr: 'You finish the poster together. The class claps.' },
    ],
    discuss: ['Have you ever been judged for something you couldn’t explain?', 'What one question could the group have asked Eric?'],
  },
  {
    id: 'laugh',
    title: 'The Laugh',
    other: 'grace',
    skill: 'Managing emotions',
    you: [
      { bg: 'classroom', chalk: 'My hero: 3 minutes', time: 'Wednesday · 10:15' },
      { cast: [{ id: 'grace', mood: 'laugh' }, { id: 'ines', mood: 'neutral' }] },
      { narr: 'You present to the class. Your mind goes blank. Then Grace laughs. Loudly.' },
      { think: 'Everyone heard. She’s laughing at me.' },
      {
        choose: [
          { text: 'Stop and stare at Grace.' },
          { text: 'Laugh too, to hide it.' },
          { text: 'Look at your notes. Keep going.' },
        ],
        save: 'c2a',
      },
      { judge: { q: 'Why did Grace laugh?', options: ['She thinks I’m stupid.', 'She wanted to embarrass me.', 'I’m not sure.'] }, save: 'c2j' },
      { switch: 'grace', text: 'Same lesson. Now you are Grace.' },
    ],
    them: [
      { bg: 'classroom', chalk: 'My hero: 3 minutes', time: 'Wednesday · 10:15' },
      { cast: [{ id: 'you', mood: 'nervous' }] },
      { narr: 'You present next. Last year you froze in front of everyone.' },
      { think: '{name} just froze. That will be me in two minutes.' },
      { narr: 'Your chest goes tight. A nervous laugh comes out. Loud.' },
      {
        when: 'c2a',
        cases: [
          [{ mood: ['you', 'angry'] }, { think: '{name} thinks I was laughing at them. I wasn’t.' }],
          [{ mood: ['you', 'sad'] }, { think: 'I made {name} feel small. I didn’t mean to.' }],
          [{ mood: ['you', 'worried'] }, { think: '{name} kept going. So brave.' }],
        ],
      },
      {
        card: {
          thought: '{c2j}',
          judged: 'c2j',
          truth: 'Grace laughs when she is scared. She was next, and terrified of freezing again.',
          lesson: 'Strong feelings can come out the wrong way. Ours too.',
        },
      },
      { back: true, text: 'Back to you. After class. Now you know.' },
    ],
    back: [
      { bg: 'yard', time: 'Wednesday · Break' },
      { cast: [{ id: 'grace', mood: 'worried' }] },
      {
        choose: [
          { text: '“You were nervous too, weren’t you?”', then: [{ say: 'grace', mood: 'happy', text: 'Yes! Sorry I laughed. Practise together next time?' }] },
          { text: '“Your talk was really good.”', then: [{ say: 'grace', mood: 'happy', text: 'Thank you. And sorry I laughed. I was scared.' }] },
        ],
      },
    ],
    discuss: ['What does your body do when you feel nervous?', 'How could your class make presenting feel safer?'],
  },
  {
    id: 'quiet',
    title: 'The Quiet One',
    other: 'kevin',
    skill: 'Relationship skills',
    you: [
      { bg: 'yard', time: 'Friday · Break' },
      { cast: [{ id: 'ines', mood: 'happy' }, { id: 'kevin', mood: 'worried' }] },
      { say: 'self', text: 'Hi! You’re new, right? Want to play with us?' },
      { narr: 'Kevin looks at you. Then he looks away. Nothing.' },
      { say: 'ines', mood: 'angry', text: 'Wow. He thinks he’s better than us.' },
      {
        choose: [
          { text: 'Walk away with Ines.' },
          { text: 'Laugh at what Ines said.' },
          { text: 'Wait. Try once more.' },
        ],
        save: 'c3a',
      },
      { judge: { q: 'What do you think about Kevin?', options: ['He’s rude.', 'He thinks he’s better than us.', 'Maybe he’s shy.'] }, save: 'c3j' },
      { switch: 'kevin', text: 'The night before. Now you are Kevin.' },
    ],
    them: [
      { bg: 'night', time: 'Thursday · 21:00' },
      { cast: [] },
      { narr: 'You moved here three weeks ago. At your old school, every lesson was in French.' },
      { think: '“Hello. My name is Kevin.” Practise again. “Hello. My name is Kevin.”' },
      { bg: 'yard', time: 'Friday · Break' },
      { cast: [{ id: 'ines', mood: 'happy' }, { id: 'you', mood: 'happy' }] },
      { say: 'you', mood: 'happy', text: 'Hi! You’re new, right? Want to play with us?' },
      { think: 'Too fast! Say something… The English words won’t come.' },
      {
        when: 'c3a',
        cases: [
          [{ cast: [] }, { think: 'They left. Alone again.' }],
          [{ mood: ['you', 'laugh'] }, { think: 'They’re laughing at me. Maybe I should stop trying.' }],
          [{ say: 'you', mood: 'neutral', text: 'It’s okay. Maybe later?' }, { think: 'Yes. Please, later.' }],
        ],
      },
      {
        card: {
          thought: '{c3j}',
          judged: 'c3j',
          truth: 'Kevin practised “Hello, my name is Kevin” every night. He needed slower words and a second chance.',
          lesson: 'Some people need a second invitation. Give it.',
        },
      },
      { back: true, text: 'Back to you. Friday break. Now you know.' },
    ],
    back: [
      { bg: 'yard', time: 'Friday · Break' },
      { cast: [{ id: 'kevin', mood: 'worried' }] },
      {
        choose: [
          { text: 'Speak slowly: “Hi. I’m {name}. Sit with us?”', then: [{ say: 'kevin', mood: 'happy', text: 'Hello. My name is Kevin. Nice to meet you.' }] },
          { text: 'Try French: “Salut ! Ça va ?”', then: [{ say: 'kevin', mood: 'happy', text: 'Salut ! Ça va bien ! You speak French?' }] },
        ],
      },
    ],
    discuss: ['What makes it hard to join a new group?', 'How can you welcome someone who doesn’t speak your language well yet?'],
  },
];
