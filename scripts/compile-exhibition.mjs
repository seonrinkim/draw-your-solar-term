// Merges data/exhibition/{layout.json,artworks.csv,context.csv} plus the
// context-translations file into one data/exhibition/compiled.json that the
// exhibition page imports directly. Re-run after editing any of those inputs:
//   node scripts/compile-exhibition.mjs

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dataDir = path.join(root, "data/exhibition");
const photosDir = path.join(root, "public/exhibition/photos");

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\r") {
      // skip, handled by \n
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  const header = rows[0];
  return rows
    .slice(1)
    .filter((r) => r.some((c) => c.trim() !== ""))
    .map((r) => Object.fromEntries(header.map((h, i) => [h.trim(), (r[i] ?? "").trim()])));
}

function splitList(s) {
  return s
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

const layout = JSON.parse(readFileSync(path.join(dataDir, "layout.json"), "utf8"));
const artworkRows = parseCsv(readFileSync(path.join(dataDir, "artworks.csv"), "utf8"));
const contextRows = parseCsv(readFileSync(path.join(dataDir, "context.csv"), "utf8"));
const contextTranslations = JSON.parse(
  readFileSync(path.join(dataDir, "context-translations.json"), "utf8")
);
const photoFiles = readdirSync(photosDir);

function findPhoto(number) {
  const file = photoFiles.find((f) => path.parse(f).name.toLowerCase() === number.toLowerCase());
  return file ? `/exhibition/photos/${file}` : null;
}

const artworksById = new Map();
for (const row of artworkRows) {
  if (!row.id) continue;
  artworksById.set(row.id, {
    number: row.Number,
    photo: findPhoto(row.Number),
    country: row.Country,
    season: row.Season,
    photographer: row.Photographer,
    date: row.Date,
    pastPresent: row["Past/Present"],
    i18n: {
      ko: { title: row["Title(kr)"], desc: row["Description(kr)"] },
      en: { title: row["TItle(eng)"], desc: row["Description(eng)"] },
      nl: { title: row["Title(nl)"], desc: row["Description(nl)"] },
    },
  });
}

const contextById = new Map();
for (const row of contextRows) {
  if (!row.id) continue;
  const tr = contextTranslations[row.id] ?? {};
  contextById.set(row.id, {
    number: row.Number,
    source: row.source,
    relatedArtworkIds: [], // filled below once we can resolve a-N -> artwork-XX
    relatedNumbers: splitList(row["matching with artworks"] ?? ""),
    relatedContextIds: splitList(row["matching with other captions"] ?? ""),
    i18n: {
      en: { desc: row["Description(eng)"] },
      ko: { desc: tr.ko ?? "" },
      nl: { desc: tr.nl ?? "" },
    },
  });
}

// number (a-6) -> artwork id (artwork-XX), so context cards can link to the
// same rect ids the layout/tool use.
const numberToArtworkId = new Map();
for (const [id, a] of artworksById) numberToArtworkId.set(a.number, id);
for (const c of contextById.values()) {
  c.relatedArtworkIds = c.relatedNumbers.map((n) => numberToArtworkId.get(n)).filter(Boolean);
  delete c.relatedNumbers;
}

const seen = new Set();
const items = [];
for (const rect of layout) {
  if (!rect.id || seen.has(rect.id)) continue; // drops the blank-id duplicate
  seen.add(rect.id);
  const base = { id: rect.id, type: rect.type, x: rect.x, y: rect.y, w: rect.w, h: rect.h };
  if (rect.type === "artwork") {
    const a = artworksById.get(rect.id);
    if (!a) {
      console.warn("no artwork data for", rect.id);
      continue;
    }
    items.push({ ...base, ...a });
  } else {
    const c = contextById.get(rect.id);
    if (!c) {
      console.warn("no context data for", rect.id);
      continue;
    }
    items.push({ ...base, ...c });
  }
}

const missingArtworkIds = [...artworksById.keys()].filter((id) => !seen.has(id));
const missingContextIds = [...contextById.keys()].filter((id) => !seen.has(id));
if (missingArtworkIds.length) console.warn("artworks with no rect in layout:", missingArtworkIds);
if (missingContextIds.length) console.warn("context with no rect in layout:", missingContextIds);

writeFileSync(
  path.join(dataDir, "compiled.json"),
  JSON.stringify({ wallImage: "/exhibition/wall.jpg", items }, null, 2)
);
console.log(`wrote ${items.length} items to data/exhibition/compiled.json`);
