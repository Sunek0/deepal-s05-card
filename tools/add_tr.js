#!/usr/bin/env node
/* Προσθέτει μεταφράσεις στα dist/lang/*.js (τα αγγλικά: src/lang_en.js):  node tools/add_tr.js <en|es> <json με {ελληνικό: μετάφραση}> */
const fs = require("fs"), path = require("path");
const [code, file] = process.argv.slice(2);
const f = code === "en" ? path.join(__dirname, "..", "src", "lang_en.js") : path.join(__dirname, "..", "dist", "lang", `${code}.js`), src = fs.readFileSync(f, "utf8");
const win = {}; new Function("window", src)(win);
const L = win.__DEEPAL_S05_LANGS[code], add = JSON.parse(fs.readFileSync(file, "utf8"));
let n = 0; for (const [k, v] of Object.entries(add)) { if (!(k in L.dict) || L.dict[k] !== v) { L.dict[k] = v; n++; } }
const head = src.split("\n")[0];
const body = " \"name\": " + JSON.stringify(L.name) + ",\n \"dict\": {\n" + Object.entries(L.dict).map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(",\n") + "\n }";
fs.writeFileSync(f, `${head}\n(window.__DEEPAL_S05_LANGS = window.__DEEPAL_S05_LANGS || {}).${code} = {\n${body}\n};\n`);
console.log(`${code}: ${n} νέες/αλλαγμένες`);
