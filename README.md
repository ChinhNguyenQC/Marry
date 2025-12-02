Will you marry me? — Static Web Invitation

What this is

A small static "Will you marry me" web page. It loads couple photos from the `img/` folder and presents them in a slideshow alongside a proposal message.

Files created
- `index.html` — the page
- `css/style.css` — styles
- `js/script.js` — slideshow + interactivity (tries to load `img/1.jpg`, `img/1.png`, `img/2.jpg`, ... up to 12)
- `img/` — folder for your photos

How to add your photos
1. Put your photos into the `img/` folder.
2. Name them sequentially such as `1.jpg`, `2.jpg`, `3.jpg` or use PNGs `1.png`, `2.png`.
3. The script tries numbers 1..12. Add as many as you like up to that limit; extend `MAX` in `js/script.js` if needed.

Configuration for names
- A small `js/config.js` file is included. It exposes `window.PROPOSAL`.
- Edit `js/config.js` to set `name1`, `name2`, and an optional `title` (the page heading).

Example `js/config.js`:

```js
window.PROPOSAL = { name1: "Alice", name2: "Bob", title: "Will you marry me?" };
```

Loading arbitrary image filenames
- The page now supports arbitrary image filenames (not just numeric). A helper `images.json` file listing the files in `img/` is used by the client to discover images.
- I generated `images.json` for you from the current `img/` folder. If you add or remove files, update `images.json` accordingly or regenerate it.

If you prefer automatic generation, you can run a small script (or I'll add one) to create `images.json` from the `img/` folder contents.

Regenerating images.json locally
 - A small helper script is included at `scripts/generate_images_json.py` to create `images.json` from whatever files are in `img/`.
 - Run from the project root with Python 3:

```powershell
python .\scripts\generate_images_json.py
```

This will overwrite `images.json` with all supported image filenames (jpg/png/webp/gif/avif/svg, etc.). Use this when you add or remove images (e.g., your 23 files).

Run locally

- Quick: double-click `index.html` or in PowerShell run:

```powershell
# from c:\Folder_Working\Marry
Start-Process .\index.html
```

- Or serve with a small HTTP server (recommended to avoid some browser restrictions):

```powershell
# Python 3 built-in server (if Python installed)
python -m http.server 8000; Start-Process http://localhost:8000
```

Customization
- Edit text in `index.html` (replace `[Name]` placeholders).
- Change visuals in `css/style.css`.
- Increase `MAX` in `js/script.js` if you have more images.

Next steps (ideas)
- Add captions per photo.
- Add music autoplay (with consent and testing across browsers).
- Add an RSVP form that posts to a server or uses an email service.

Starfall visual effect
- A lightweight canvas starfall effect is included (`js/starfall.js`). It appends a full-screen canvas and animates subtle falling stars over the page. You don't need to configure anything — it runs automatically.

Disable pull-to-refresh on mobile
- The project now disables the browser "pull-to-refresh" gesture on mobile so a downward pull won't accidentally refresh the page. This is implemented by adding `overscroll-behavior-y: none` in `css/style.css` and a small JS fallback handler in `js/script.js` (for older iOS Safari that doesn't support the CSS property).


Enjoy! Put your pictures into `img/` and open `index.html` to preview the proposal.