// Bakes index.html + style.css + js/*.js into one self-contained file for
// hosting anywhere (no server, no relative paths, no CORS). The source files
// stay the dev setup described in CLAUDE.md; this just inlines them.
// Run: node build.js  →  writes dist/index.html
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const OUT_DIR = path.join(ROOT, 'dist');

let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

const css = fs.readFileSync(path.join(ROOT, 'style.css'), 'utf8');
html = html.replace(
  /<link rel="stylesheet" href="style\.css">/,
  `<style>\n${css}</style>`
);

const scriptTag = /<script src="js\/([\w.]+)"><\/script>/g;
const files = [];
let m;
while ((m = scriptTag.exec(html))) files.push(m[1]);

const bundle = files
  .map(f => fs.readFileSync(path.join(ROOT, 'js', f), 'utf8'))
  .join('\n;\n');

html = html.replace(scriptTag, '').replace(
  '</body>',
  `<script>\n${bundle}\n</script>\n</body>`
);

fs.mkdirSync(OUT_DIR, { recursive: true });
const outPath = path.join(OUT_DIR, 'index.html');
fs.writeFileSync(outPath, html);

if (fs.existsSync(path.join(ROOT, 'favicon.svg'))) {
  fs.copyFileSync(path.join(ROOT, 'favicon.svg'), path.join(OUT_DIR, 'favicon.svg'));
}

console.log('built ' + outPath + '  (' + (html.length / 1024).toFixed(0) + ' KB)');
