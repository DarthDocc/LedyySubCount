# BotRix Total Subs Widget V3

## Included

- `index.html` — OBS widget
- `style.css` — widget styling
- `script.js` — BotRix polling and URL settings
- `setup.html` — visual URL/widget builder
- `cloudflare-worker.js` — optional CORS proxy

## GitHub Pages installation

Upload all files to the root of your GitHub repository and enable GitHub Pages
from the `main` branch and `/ (root)`.

Open:

    https://YOUR-NAME.github.io/YOUR-REPO/setup.html

Paste your BotRix subscriber label URL, customize the design, then copy the
generated OBS URL.

## OBS

Recommended Browser Source size:

- Width: 500
- Height: 200

## Shareable URLs

Each streamer can use the same GitHub Pages project by putting their own BotRix
`bid` in the generated query string.

## Current limitation

The widget attempts to poll BotRix directly. If BotRix blocks cross-origin
requests, deploy the included Cloudflare Worker and paste its URL into the
builder's Proxy URL field.

The full instant Pusher WebSocket implementation still requires the Pusher app
key/cluster, auth endpoint response format, and the actual subscriber event name.
