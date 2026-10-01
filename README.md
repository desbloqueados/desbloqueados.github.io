# Unblocked Games

A static game library for GitHub Pages. Serve this directory with an HTTP server
(for example, `python3 -m http.server 8000`) and open `http://localhost:8000`.

The library includes all 139 entries from
[Nintendoboi2222's catalog](https://github.com/Nintendoboi2222/nintendoboi2222.github.io)
as checked on October 1, 2026. Four titles already available here use the local
edition: Slope, Doom, Cookie Clicker, and Drift Hunters. With the existing FNAF 1
and HexGL editions, the library has 141 entries total.

`assets/js/games.js` contains the catalog. `assets/js/library.js` draws a canvas
cover for each entry and launches one game at a time in an isolated iframe.
Canvas/WebGL games render their own canvas inside that frame; DOM games keep
their original interface. Closing or restarting the player destroys its frame
to stop the previous runtime and audio. `#game=poly-track` and similar URLs open
a game directly, and browser back/forward navigates the player.

The imported games **are embedded from the published source site**, not copied
into this repository. Their game files are absent from the linked repository's
current main branch. They require internet access and depend on the source site
and its third-party assets remaining available. The player provides an “open
game” link for games that restrict embedding or need their own browser tab.
An iframe loading successfully does not guarantee that every game asset or
legacy runtime works. Games belong to their respective creators.

The six existing local editions remain in `games/` (Slope also uses `Build/`
and `TemplateData/`). UI attribution and the MIT license are preserved in
`UI-LICENSE.txt`.
