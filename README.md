# In Their Shoes

A short story game about empathy. Three stories, about one minute each.

In each story something happens at school: a groupmate shows up late, a classmate laughs during your talk, a new student ignores you. You react however you want, then you honestly judge them. Then the screen flips and **you live the same moment as that person**. You see what they were going through, and how your own words landed on them. Finally you go back to the moment as yourself and choose again.

| Story | What happens | SEL skill |
| --- | --- | --- |
| The Late One | Eric is late with no poster | Empathy |
| The Laugh | Grace laughs while you present | Managing emotions |
| The Quiet One | Kevin, the new student, doesn't answer | Relationship skills |

At the end you get an **empathy journal**: what you thought, what was true, and one lesson per story. There's also a private reflection box and discussion questions for teachers.

## Play

Double-click `index.html`, or `play.bat`. It works offline in any modern browser. Fonts load from Google Fonts when online, and fall back to system fonts.

Controls: tap or Space to continue, 1/2/3 to choose.

## Design choices

- **No scores.** Nothing rates how empathetic you are. The judgement you pick is only shown back to you.
- **Your choices come back to you.** When you replay a moment as the other person, you hear exactly what you said to them.
- **Nothing leaves the device.** Progress is kept in the browser's local storage; the reflection box is never saved or sent.
- **Every character and story is fictional.**

## Files

- `index.html`, `style.css`
- `js/story.js`: all the stories and characters, as data. Add a story by adding a chapter.
- `js/art.js`: faces with nine expressions and the scenes, drawn in SVG
- `js/game.js`: the story engine
- `scripts/playthrough.mjs`: plays the whole game in headless Chrome and takes screenshots (`node scripts/playthrough.mjs --pick=0`)
