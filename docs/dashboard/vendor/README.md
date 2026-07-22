# vendor/

`peerjs.min.js` is PeerJS 1.5.4's UMD build (`dist/peerjs.min.js` from the
`peerjs` npm package), vendored so the dashboard has no build step and no
runtime CDN dependency. To update: `npm pack peerjs@<version>` elsewhere and
copy `dist/peerjs.min.js` over this file.
