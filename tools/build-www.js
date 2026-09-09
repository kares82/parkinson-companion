/* ============================================================================
   Assemble www/ — the folder Capacitor packages into the app.

   The app has no build step and is not getting one: this copies files, it does
   not transform them. What it does is DECIDE which files belong inside an app,
   and that list is shorter than the list that belongs on the website.

   Pointing Capacitor at the repository root instead would ship store/,
   fastlane/, tests/ and .github/ inside the binary — the submission plan, the
   regulatory notes and the CI configuration, handed to every user and to App
   Review.

   Run before every `npx cap sync`:   node tools/build-www.js
   ========================================================================== */
"use strict";

var fs = require("fs");
var path = require("path");

var ROOT = path.resolve(__dirname, "..");
var OUT = path.join(ROOT, "www");

/* The app, and the one page reachable from inside it. */
var FILES = [
  "index.html",
  "privacy.html",          // linked from Settings; both stores want it in-app
  "manifest.webmanifest",
  "icon-192.png",
  "icon-512.png",
  "icon-maskable-512.png"
];

/* Left out on purpose:

   sw.js            A service worker is how a WEBSITE works offline. Inside the
                    app the files are already on the device, and a cache-first
                    worker would pin an old build until its version happened to
                    change — an update mechanism fighting the store's.
   404.html         Cloudflare serves that. There is no wrong URL to reach in
                    an app that has exactly one page.
   icon-1024.png    The App Store listing icon. It goes to App Store Connect,
                    not into the bundle.
   store/, tests/, fastlane/, tools/, .github/, ios-native/
                    Repository furniture. None of it is the product.
*/

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

var missing = [];
FILES.forEach(function (f) {
  var src = path.join(ROOT, f);
  if (!fs.existsSync(src)) { missing.push(f); return; }
  fs.copyFileSync(src, path.join(OUT, f));
});

if (missing.length) {
  console.error("build-www: missing " + missing.join(", "));
  process.exit(1);
}

/* The service worker is deliberately absent, so a stale registration left by a
   previous build would keep serving its cache forever. Unregister on start. */
var idx = path.join(OUT, "index.html");
var html = fs.readFileSync(idx, "utf8");
html = html.replace(
  /if\("serviceWorker" in navigator\)\{[\s\S]*?\n\}/,
  'if ("serviceWorker" in navigator && navigator.serviceWorker.getRegistrations) {\n' +
  '  /* Native build: no service worker. Remove any left by a web visit to the\n' +
  '     same origin, which would otherwise keep serving its cached copy. */\n' +
  '  navigator.serviceWorker.getRegistrations()\n' +
  '    .then(function (rs) { rs.forEach(function (r) { r.unregister(); }); })\n' +
  '    .catch(function () {});\n' +
  '}'
);
fs.writeFileSync(idx, html);

console.log("build-www: " + FILES.length + " file(s) -> www/");
