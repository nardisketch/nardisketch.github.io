#!/usr/bin/env node
// Interactive reorder tool for the full gallery.
// Reads/writes src/data/gallery.json — an ordered list of filenames.
//   npm run gallery

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createInterface } from 'node:readline';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST = join(root, 'src/data/gallery.json');
const IMAGES_DIR = join(root, 'src/assets/gallery');
const IMAGE_RE = /\.(png|jpe?g|webp|avif)$/i;

const files = new Set(readdirSync(IMAGES_DIR).filter((f) => IMAGE_RE.test(f)));

let manifest = [];
try {
  manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
} catch {
  /* no manifest yet — start from scratch */
}

// Working order: manifest entries that still have a file, then any file not
// in the manifest (natural sort), appended.
const missing = manifest.filter((n) => !files.has(n));
const unlisted = [...files]
  .filter((n) => !manifest.includes(n))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

let order = [...manifest.filter((n) => files.has(n)), ...unlisted];
let dirty = missing.length > 0 || unlisted.length > 0;

if (missing.length) {
  console.log(`\n!  ${missing.length} entr${missing.length === 1 ? 'y has' : 'ies have'} no file and will be dropped on save:`);
  missing.forEach((n) => console.log(`     ${n}`));
}
if (unlisted.length) {
  console.log(`\n+  ${unlisted.length} image(s) not yet in gallery.json, added at the end:`);
  unlisted.forEach((n) => console.log(`     ${n}`));
}

function printList() {
  const w = String(order.length).length;
  console.log('');
  order.forEach((n, i) => console.log(`  ${String(i + 1).padStart(w)}  ${n}`));
  console.log('');
}

function printHelp() {
  console.log(`
  list                 show the current order
  move <from> <to>     move the image at <from> to position <to>
  top <n>              move image <n> to the top
  bottom <n>           move image <n> to the bottom
  swap <a> <b>         swap two images
  save                 write src/data/gallery.json
  quit                 exit  (quit! to discard unsaved changes)

  Positions are the 1-based numbers from "list".
  Add an image: drop the file in src/assets/gallery/ and re-run — it lands
  at the end. Remove one: delete the file.
`);
}

function pos(s) {
  const n = Number(s);
  if (!Number.isInteger(n) || n < 1 || n > order.length) {
    console.log(`  ? position must be a number 1..${order.length}`);
    return null;
  }
  return n - 1;
}

const rl = createInterface({ input: process.stdin, output: process.stdout, prompt: 'gallery> ' });

function handle(line) {
  const [cmd, ...args] = line.trim().split(/\s+/);
  switch (cmd) {
    case '':
      return;
    case 'l':
    case 'list':
      return printList();
    case 'h':
    case 'help':
      return printHelp();
    case 'mv':
    case 'move': {
      const from = pos(args[0]);
      const to = pos(args[1]);
      if (from === null || to === null) return;
      const [item] = order.splice(from, 1);
      order.splice(to, 0, item);
      dirty = true;
      console.log(`  moved ${item} -> ${to + 1}`);
      return printList();
    }
    case 'top': {
      const from = pos(args[0]);
      if (from === null) return;
      order.unshift(...order.splice(from, 1));
      dirty = true;
      return printList();
    }
    case 'bottom':
    case 'bot': {
      const from = pos(args[0]);
      if (from === null) return;
      order.push(...order.splice(from, 1));
      dirty = true;
      return printList();
    }
    case 'swap': {
      const a = pos(args[0]);
      const b = pos(args[1]);
      if (a === null || b === null) return;
      [order[a], order[b]] = [order[b], order[a]];
      dirty = true;
      return printList();
    }
    case 's':
    case 'save':
      writeFileSync(MANIFEST, JSON.stringify(order, null, 2) + '\n');
      dirty = false;
      console.log(`  saved ${order.length} entries to src/data/gallery.json`);
      return;
    case 'q':
    case 'quit':
    case 'exit':
      if (dirty) {
        console.log('  unsaved changes — "save" first, or "quit!" to discard');
        return;
      }
      return rl.close();
    case 'quit!':
      return rl.close();
    default:
      console.log(`  ? unknown command "${cmd}" — type "help"`);
  }
}

console.log(
  `\n${order.length} images. Commands: list, move <from> <to>, top <n>, bottom <n>, swap <a> <b>, save, quit  ("help" for more)`,
);
printList();
rl.prompt();
rl.on('line', (line) => {
  handle(line);
  rl.prompt();
});
rl.on('close', () => {
  if (dirty) console.log('(quit without saving)');
  process.exit(0);
});
