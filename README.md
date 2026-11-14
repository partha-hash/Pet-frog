# Pip the Pond Frog

A small, responsive, static web toy built with plain HTML, CSS and vanilla JavaScript. Pip is an original sleepy, humanoid pond frog character with a deliberately droopy, dreamy expression and a wide expressive mouth. The character is drawn as an inline SVG and changes expression through CSS states.

## Features

- 12 selectable expressions, including Stoned, Happy, Laughing, Crying, Smug, Angry, Shocked, Sleepy, In Love, Cool, Thinking and Queasy.
- Feed Pip and track his fullness.
- Rename Pip.
- Text-to-speech using the browser's Web Speech API.
- A tiny word-to-melody feature using the Web Audio API.
- Responsive layout for desktop and mobile.
- No build step, framework, backend or external asset files.

## Run locally

1. Download and unzip the project.
2. Open `index.html` in a modern browser.
3. Tap **SAY IT** or **SING THIS** to allow the browser to start audio.

For the most reliable browser speech and audio behavior, serve the folder locally rather than opening the file directly. For example:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Deploy to Vercel

1. Create a new GitHub repository and upload `index.html`, `style.css`, `script.js` and `README.md` to its root.
2. In Vercel, choose **Add New → Project** and import that repository.
3. Keep the framework preset as **Other**.
4. Leave the build command empty.
5. Set the output directory to `.` (the project root).
6. Deploy.

## Notes

- Speech synthesis depends on voices installed in the user's browser/device. Voice quality and availability vary.
- The singing feature is a playful synthesized word-to-note sketch, not a full vocal synthesizer or MIDI export.
- Audio starts only after a user interaction, as required by most browsers.
- The frog illustration is original inline SVG artwork created for this project. It is inspired by broad traits of expressive internet cartoon frogs, not a copied Pepe asset or meme sheet.
