# One Year of Us

A one-page anniversary site: six chapters, each with its own photos and songs.
Music starts on her first tap (phones require one) and crossfades as she scrolls into each chapter.

## Add the songs
Put your own audio files in `audio/` with these names (or change the names in `content.js`):

| Chapter | File |
|---|---|
| Opening screen | `audio/seoul-city.mp3` (included) |
| 01 Irufushi | `audio/color-violet.mp3` (included) |
| 02 Hulhumalé | `audio/no-one-noticed.mp3` (included) |
| 03 Malé (December) | `audio/love-me-not.mp3` (included) |
| 04 Hanoi | `audio/every-breath.mp3` (included) |
| 05 Malé (June) | `audio/reflections.mp3` (included) |
| 06 Maafushi | `audio/sailor-song.mp3` (included) |
| Letter | `audio/i-wanna-be-yours.mp3` (included) |

A chapter with no songs just keeps the previous song playing.
Tip: trim each track to start at your favourite part before adding it.

## Add photos
Drop them in `photos/<chapter folder>/` and list them in `content.js`, for example:

```js
photos: [
  { src: "photos/4-hanoi/01.jpg", caption: "Hoan Kiem, 6am" },
  { src: "photos/4-hanoi/02.jpg" }
]
```

Export at around 2000px on the long edge so the site loads fast on mobile data.

## Put it online (GitHub Pages)
1. Create a new repository on GitHub and upload everything in this folder (keep `index.html` at the top level).
2. Go to **Settings → Pages**, set the source to **Deploy from a branch**, branch **main**, folder **/ (root)**, then save.
3. After a minute, the site is at `https://<your-username>.github.io/<repo-name>/`.

Make the repo private if you have a paid GitHub plan; on a free plan, Pages needs a public repo, so anyone with the link could see it.
