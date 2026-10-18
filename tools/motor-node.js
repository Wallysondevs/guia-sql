// motor-node.js — carrega o SQLite WASM do editor (assets/sql/) e a Loja Aurora no Node.
// Uso: const { pronto } = require("./motor-node"); pronto().then(({ sqlite3, seed, SQLSim }) => …)
"use strict";
const fs = require("fs");
const path = require("path");
const RAIZ = path.join(__dirname, "..");
let promessa = null;

function pronto() {
  if (promessa) return promessa;
  const SQLSim = require(path.join(RAIZ, "assets/sqlsim.js"));
  require(path.join(RAIZ, "assets/sql/sqlite3.js")); // define globalThis.sqlite3InitModule
  const avisoOPFS = console.warn, avisoLog = console.log;
  console.warn = console.log = () => {};               // o glue reclama da falta de OPFS
  promessa = globalThis.sqlite3InitModule({
    wasmBinary: fs.readFileSync(path.join(RAIZ, "assets/sql/sqlite3.wasm")),
    print() {}, printErr() {},
  }).then((sqlite3) => {
    console.warn = avisoOPFS; console.log = avisoLog;
    const seed = fs.readFileSync(path.join(RAIZ, "assets/sql/aurora.sql"), "utf8");
    return { sqlite3, seed, SQLSim };
  });
  return promessa;
}
module.exports = { pronto, RAIZ };
