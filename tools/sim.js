#!/usr/bin/env node
// sim.js arquivo.sql   (ou: echo "SELECT 1;" | node tools/sim.js -)
// Roda o SQL exatamente como o editor do guia (.trysql) rodaria: banco novo em memória com a
// Loja Aurora, comando por comando. Mostra cada resultado; serve para colher saídas para as aulas.
//   --canonico   imprime só a saída canônica (o que out:/contem: enxergam)
//   --goal META  avalia uma meta contra o resultado
"use strict";
const fs = require("fs");
const { pronto } = require("./motor-node");

const args = process.argv.slice(2);
let canonico = false, goal = null, arq = null;
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--canonico") canonico = true;
  else if (args[i] === "--goal") goal = args[++i];
  else arq = args[i];
}
if (!arq) { console.error("uso: node tools/sim.js [--canonico] [--goal META] arquivo.sql|-"); process.exit(2); }
const sql = fs.readFileSync(arq === "-" ? 0 : arq, "utf8");

pronto().then(({ sqlite3, seed, SQLSim }) => {
  const res = SQLSim.rodar(sqlite3, seed, sql);
  if (canonico) { if (res.canonico) console.log(res.canonico); }
  else {
    res.itens.forEach((it, n) => {
      if (n) console.log("");
      if (it.tipo === "select") {
        console.log("colunas: " + it.colunas.join(" | "));
        it.linhas.forEach((l) => console.log(l.map((v) => (v === null ? "NULL" : v)).join("|")));
        const n = it.total != null ? it.total : it.linhas.length;
        console.log("(" + n + (n === 1 ? " linha)" : " linhas)") + (n > it.linhas.length ? " — só as " + it.linhas.length + " primeiras guardadas" : ""));
      } else if (it.tipo === "mudanca") console.log(it.verbo + ": " + it.n + (it.n === 1 ? " linha afetada" : " linhas afetadas"));
      else console.log(it.verbo + ": ok");
    });
    if (res.erro) console.log((res.itens.length ? "\n" : "") + "ERRO: " + res.erro.msg);
  }
  if (goal !== null) {
    const r = SQLSim.avaliarMetas(goal, res);
    console.log("\nmetas:");
    r.forEach((x) => console.log((x.ok ? "  ok    " : "  FALHA ") + (x.meta || x.texto || JSON.stringify(x)) + (x.ok ? "" : "  — " + (x.motivo || ""))));
    process.exitCode = r.every((x) => x.ok) ? 0 : 1;
  } else if (res.erro) process.exitCode = 1;
});
