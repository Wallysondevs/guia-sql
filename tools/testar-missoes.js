#!/usr/bin/env node
// testar-missoes.js — confere as páginas do Guia SQL antes do commit.
//
//   node tools/testar-missoes.js pagina.html [outra.html…]
//   node tools/testar-missoes.js --nativo pagina.html     (+ compara com o sqlite3 do lab)
//   node tools/testar-missoes.js --todas                  (todas as .html da raiz)
//   -q / --quieto   mostra só FALHA e aviso (e o resumo)
//
// Para cada página:
//   - cada caixa .trysql: meta válida, missão com pre.solucao, o código INICIAL
//     NÃO cumpre a meta e a SOLUÇÃO cumpre (rodando no MESMO motor do editor:
//     assets/sql/sqlite3.wasm + assets/sqlsim.js);
//   - cada pre.file[data-resultado]: o SQL roda sem erro (ou dá erro, se o pre
//     tiver data-erro: exemplo de erro de propósito);
//   - todo <pre>: "<" e "&" escapados (&lt; &amp;);
//   - links internos só para páginas da NIVEIS; nada da máquina real.
// --nativo: roda cada SQL também em ~/guia-sql-lab/src/sqlite3 (o 3.50.4 do lab,
//   mesmas opções do wasm), compara com a saída canônica e registra as
//   diferenças em tools/DIFERENCAS.md (seção da página).
// Código de saída: 0 = tudo ok; 1 = alguma FALHA; 2 = uso errado / página inexistente.
"use strict";
const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawnSync } = require("child_process");
const { pronto, RAIZ } = require("./motor-node");

const NATIVO_BIN = process.env.SQLITE_NATIVO || path.join(os.homedir(), "guia-sql-lab/src/sqlite3");
const DIFERENCAS = path.join(RAIZ, "tools/DIFERENCAS.md");

/* ------------------------------------------------------------------ args */
const args = process.argv.slice(2);
let nativo = false, quieto = false, todas = false;
const paginas = [];
for (const a of args) {
  if (a === "--nativo") nativo = true;
  else if (a === "-q" || a === "--quieto") quieto = true;
  else if (a === "--todas") todas = true;
  else if (a === "-h" || a === "--help") { uso(0); }
  else if (a.startsWith("-")) { console.error("opção desconhecida: " + a); uso(2); }
  else paginas.push(a);
}
function uso(cod) {
  console.error("uso: node tools/testar-missoes.js [--nativo] [-q] pagina.html [outra.html…]\n" +
    "     node tools/testar-missoes.js [--nativo] [-q] --todas");
  process.exit(cod);
}
if (todas) {
  fs.readdirSync(RAIZ).filter((f) => /\.html$/.test(f)).sort().forEach((f) => paginas.push(f));
}
if (!paginas.length) uso(2);

/* ------------------------------------------------------------- utilidades */
const ENT = { lt: "<", gt: ">", amp: "&", quot: '"', apos: "'", nbsp: " ", middot: "·", rarr: "→",
  larr: "←", uarr: "↑", darr: "↓", harr: "↔", hellip: "…", mdash: "—", ndash: "–", laquo: "«", raquo: "»",
  copy: "©", deg: "°", times: "×", divide: "÷", sect: "§", bull: "•", check: "✓", ordm: "º", ordf: "ª",
  lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”", shy: "­", zwj: "‍", ne: "≠", le: "≤", ge: "≥" };
const RE_ENT = /&(#\d+|#[xX][0-9a-fA-F]+|[A-Za-z][A-Za-z0-9]*);/g;
function decodificar(s) {
  return s.replace(RE_ENT, (m, e) => {
    if (e[0] === "#") {
      const n = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return String.fromCodePoint(n);
    }
    return Object.prototype.hasOwnProperty.call(ENT, e) ? ENT[e] : m;
  });
}
function atributos(s) {
  const r = {};
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let m;
  while ((m = re.exec(s))) r[m[1].toLowerCase()] = decodificar(m[2] ?? m[3] ?? m[4] ?? "");
  return r;
}
function classes(at) { return (at["class"] || "").split(/\s+/).filter(Boolean); }
function trecho(s, i, n = 30) {
  return JSON.stringify(s.slice(Math.max(0, i - n), i + n).replace(/\s+/g, " "));
}
function linhasDe(n) { return n === 1 ? "1 linha" : n + " linhas"; }
// o texto que o navegador (e o sqlsim.lerPre) enxerga dentro de um <pre>
function textoPre(cru) {
  let t = decodificar(cru.replace(/<[^>]*>/g, ""));
  t = t.replace(/^\n/, "");                 // o parser de HTML come o 1º \n depois de <pre>
  return t.replace(/^\n/, "").replace(/\n$/, ""); // e o lerPre tira mais um de cada ponta
}
// NIVEIS: as páginas que existem no menu
function paginasNiveis() {
  try {
    const js = fs.readFileSync(path.join(RAIZ, "assets/site.js"), "utf8");
    const ini = js.indexOf("var NIVEIS"), fim = js.indexOf("];", ini);
    const set = new Set();
    for (const m of js.slice(ini, fim).matchAll(/\[\s*"([^"]+\.html)"/g)) set.add(m[1]);
    return set;
  } catch (e) { return null; }
}
const NIVEIS = paginasNiveis();
const PAGINAS_FORA_DA_NIVEIS = new Set(["simulador-teste-interno.html"]);

/* ------------------------------------------------------- leitura da página */
// Devolve { caixas:[…], resultados:[…], pres:[…], problemas:[…] }
function analisarHtml(html) {
  // comentários HTML viram espaço (mantendo as quebras de linha, p/ os números de linha)
  const src = html.replace(/<!--[\s\S]*?-->/g, (c) => c.replace(/[^\n]/g, " "));
  const linhaDe = (i) => src.slice(0, i).split("\n").length;
  const problemas = [];

  // todos os <pre>
  const pres = [];
  const rePre = /<pre\b([^>]*)>([\s\S]*?)<\/pre\s*>/gi;
  let m;
  while ((m = rePre.exec(src))) {
    const at = atributos(m[1]);
    const ini = m.index + m[0].indexOf(">") + 1;
    pres.push({ at, cls: classes(at), cru: m[2], ini, fim: ini + m[2].length, linha: linhaDe(m.index) });
  }

  // escape dentro dos <pre>
  for (const p of pres) {
    const codigo = !p.cls.includes("term");
    const nome = "<pre" + (p.at["class"] ? ' class="' + p.at["class"] + '"' : "") + ">";
    const reTagOk = codigo ? /^<\/?(mark|b|strong|em|i|span)(\s+class="[^"]*")?>/ :
      /^<\/?[a-zA-Z][\w-]*(\s+[\w-]+(\s*=\s*("[^"]*"|'[^']*'))?)*\s*\/?>/;
    let i = -1;
    while ((i = p.cru.indexOf("<", i + 1)) >= 0) {
      if (reTagOk.test(p.cru.slice(i))) continue;
      problemas.push({ grav: "FALHA", linha: linhaDe(p.ini + i),
        msg: '"<" sem escape dentro de ' + nome + " (escreva &lt;): " + trecho(p.cru, i) });
      break;
    }
    i = -1;
    while ((i = p.cru.indexOf("&", i + 1)) >= 0) {
      const ent = /^&(#\d+|#[xX][0-9a-fA-F]+|[A-Za-z][A-Za-z0-9]*);/.exec(p.cru.slice(i));
      if (ent && (ent[1][0] === "#" || ENT[ent[1]])) continue;
      if (ent) {
        problemas.push({ grav: codigo ? "FALHA" : "aviso", linha: linhaDe(p.ini + i),
          msg: "entidade " + ent[0] + " que o testador não conhece, dentro de " + nome + " (use &lt; &gt; &amp; &quot; ou o caractere direto)" });
      } else {
        problemas.push({ grav: "FALHA", linha: linhaDe(p.ini + i),
          msg: '"&" sem escape dentro de ' + nome + " (escreva &amp;): " + trecho(p.cru, i) });
      }
      break;
    }
  }

  // as caixas .trysql (contando os <div> aninhados)
  const caixas = [];
  const reDiv = /<div\b([^>]*)>/gi;
  while ((m = reDiv.exec(src))) {
    const at = atributos(m[1]);
    if (!classes(at).includes("trysql")) continue;
    const reTok = /<(\/?)div\b[^>]*>/gi;
    reTok.lastIndex = m.index + m[0].length;
    let prof = 1, t, fim = -1;
    while ((t = reTok.exec(src))) {
      prof += t[1] ? -1 : 1;
      if (!prof) { fim = t.index; break; }
    }
    const linha = linhaDe(m.index);
    if (fim < 0) { problemas.push({ grav: "FALHA", linha, msg: '<div class="trysql"> sem o </div> de fechamento' }); continue; }
    const ini = m.index + m[0].length;
    const dentro = pres.filter((p) => p.ini > ini && p.fim < fim);
    caixas.push({
      at, linha, goal: at["data-goal"],
      script: dentro.filter((p) => p.cls.includes("script")),
      solucao: dentro.filter((p) => p.cls.includes("solucao")),
      erroOk: "data-erro" in at,
    });
    dentro.forEach((p) => { p.naCaixa = true; });
  }

  const resultados = pres.filter((p) => p.cls.includes("file") && "data-resultado" in p.at)
    .map((p) => ({ linha: p.linha, codigo: textoPre(p.cru), erroOk: "data-erro" in p.at, naCaixa: p.naCaixa }));
  pres.filter((p) => !p.naCaixa && (p.cls.includes("solucao") || p.cls.includes("script")) &&
    !p.cls.includes("file") && !p.cls.includes("term")).forEach((p) => {
    problemas.push({ grav: "aviso", linha: p.linha, msg: '<pre class="' + p.at["class"] + '"> fora de uma caixa .trysql (o editor ignora)' });
  });

  // links internos e privacidade
  for (const l of src.matchAll(/\bhref\s*=\s*"([^"#?:]+\.html)(?:[#?][^"]*)?"/g)) {
    const alvo = l[1];
    if (NIVEIS && !NIVEIS.has(alvo) && !alvo.includes("/"))
      problemas.push({ grav: "aviso", linha: linhaDe(l.index), msg: 'link para "' + alvo + '", que não está na NIVEIS' });
  }
  const PROIBIDO = /\/home\/admin|\/home\/wallyson|wallyson|ip-172-\d|guia-sql-lab|\/tmp\/claude/i;
  const linhasSrc = html.split("\n");
  for (let k = 0; k < linhasSrc.length; k++) {
    const p = PROIBIDO.exec(linhasSrc[k]);
    if (p) problemas.push({ grav: "FALHA", linha: k + 1, msg: 'dado da máquina real na página: "' + p[0] + '" (use só /home/ana e ana@notebook)' });
  }
  return { caixas, resultados, problemas };
}

/* ---------------------------------------------------------------- nativo */
let seedPath = null;
function rodarNativo(sql) {
  const r = spawnSync(NATIVO_BIN, ["-bail", "-batch", "-cmd", ".read '" + seedPath.replace(/'/g, "''") + "'", ":memory:"],
    { input: sql + "\n", encoding: "utf8", timeout: 10000, maxBuffer: 64 * 1024 * 1024 });
  if (r.error && r.error.code === "ETIMEDOUT") return { tempo: true, stdout: r.stdout || "", stderr: "(o sqlite3 nativo passou de 10 s e foi interrompido)" };
  if (r.error) return { falhou: r.error.message };
  return { stdout: (r.stdout || "").replace(/\n$/, ""), stderr: (r.stderr || "").replace(/\n+$/, ""), status: r.status };
}
function compararNativo(sql, res) {
  if (res.erro && res.erro.msg === "interrupted") return null; // a trava do editor; o nativo não tem
  const n = rodarNativo(sql);
  if (n.falhou) return { motivo: "não consegui rodar o sqlite3 nativo: " + n.falhou };
  const difs = [];
  if (n.stdout !== res.canonico) difs.push("saída diferente");
  const errNat = n.tempo || n.status !== 0;
  if (!!res.erro !== errNat) difs.push(res.erro ? "o editor deu erro e o nativo não" : "o nativo deu erro e o editor não");
  else if (res.erro && n.stderr.indexOf(res.erro.msg) < 0) difs.push("mensagem de erro diferente");
  if (!difs.length) return null;
  return { motivo: difs.join("; "), nativo: n };
}

/* --------------------------------------------------------- DIFERENCAS.md */
const CABECALHO_DIF = `# Diferenças: editor do guia (SQLite WASM) × sqlite3 nativo do lab

Mantido pelo \`tools/testar-missoes.js --nativo\`. O editor (\`assets/sql/sqlite3.wasm\`) e o lab
(\`~/guia-sql-lab/src/sqlite3\`) são o **mesmo SQLite 3.50.4**, compilado com as **mesmas opções**
(DQS=0, FTS5, math, dbstat…). Por isso a saída canônica (\`.mode list\`, NULL vazio) deve ser
idêntica; qualquer diferença aparece abaixo, na seção da página.

## Diferenças conhecidas (esperadas, não aparecem como diferença)
| Assunto | Editor do guia | sqlite3 no terminal |
|---|---|---|
| Mensagem de erro | a mensagem crua: \`no such table: cliente\` | \`Parse error: no such table: cliente\` (ou \`Runtime error: …\`; com stdin de arquivo: \`Parse error near line 2: …\`), às vezes com a seta \`^--- error here\` |
| Comandos de ponto (\`.tables\`) | não existem: erro de sintaxe | funcionam (são do programa sqlite3) |
| SQL sem fim | interrompido em ~4 s com \`interrupted\` | roda até alguém apertar Ctrl+C |
| Tabela grande | desenha até 500 linhas (as metas contam todas) | mostra todas |
| Cabeçalho e formato | tabela HTML com cabeçalho | \`.mode list\` sem cabeçalho, até mudar com \`.mode\`/\`.headers\` |

O testador compara a mensagem de erro só pelo miolo (a do editor tem de aparecer dentro da do terminal).

## Diferenças encontradas
<!-- AUTO: cada página tem a sua seção, reescrita a cada --nativo. Página sem diferença não aparece. -->
`;
function travar(fn) {
  const lock = DIFERENCAS + ".lock";
  for (let t = 0; t < 100; t++) {
    try {
      const fd = fs.openSync(lock, "wx");
      try { return fn(); } finally { fs.closeSync(fd); fs.unlinkSync(lock); }
    } catch (e) {
      if (e.code !== "EEXIST") throw e;
      try { if (Date.now() - fs.statSync(lock).mtimeMs > 30000) fs.unlinkSync(lock); } catch (e2) {}
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 200);
    }
  }
  throw new Error("não consegui travar " + DIFERENCAS + ".lock");
}
function cerca(s) { const n = Math.max(3, ...(String(s).match(/`+/g) || [""]).map((x) => x.length + 1)); return "`".repeat(n); }
function gravarDiferencas(pagina, lista) {
  travar(() => {
    let txt = fs.existsSync(DIFERENCAS) ? fs.readFileSync(DIFERENCAS, "utf8") : CABECALHO_DIF;
    const abre = "<!-- pagina:" + pagina + " -->", fecha = "<!-- /pagina:" + pagina + " -->";
    const a = txt.indexOf(abre), f = txt.indexOf(fecha);
    if (a >= 0 && f > a) txt = txt.slice(0, a).replace(/\n+$/, "\n") + txt.slice(f + fecha.length).replace(/^\n+/, "\n");
    if (lista.length) {
      let s = "\n" + abre + "\n### " + pagina + " (" + new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC)\n";
      for (const d of lista) {
        s += "\n**" + d.onde + "** — " + d.motivo + "\n\n" +
          cerca(d.sql) + "sql\n" + d.sql + "\n" + cerca(d.sql) + "\n\n" +
          "- editor: " + (d.res.erro ? "erro `" + d.res.erro.msg + "`; " : "") + "saída:\n\n" +
          cerca(d.res.canonico) + "\n" + d.res.canonico + "\n" + cerca(d.res.canonico) + "\n" +
          "- sqlite3 nativo (status " + d.nativo.status + "): saída:\n\n" +
          cerca(d.nativo.stdout) + "\n" + d.nativo.stdout + "\n" + cerca(d.nativo.stdout) + "\n" +
          (d.nativo.stderr ? "  stderr:\n\n" + cerca(d.nativo.stderr) + "\n" + d.nativo.stderr + "\n" + cerca(d.nativo.stderr) + "\n" : "");
      }
      txt = txt.replace(/\n*$/, "\n") + s + fecha + "\n";
    }
    fs.writeFileSync(DIFERENCAS, txt);
  });
}

/* ------------------------------------------------------------- o teste */
function testarPagina(arq, motor) {
  const { sqlite3, seed, SQLSim } = motor;
  const html = fs.readFileSync(arq, "utf8");
  const nomePag = path.basename(arq);
  const { caixas, resultados, problemas } = analisarHtml(html);
  const itens = problemas.slice(); // {grav, linha, msg}
  const difs = [];
  let nDifComparados = 0;

  function rodar(sql, onde) {
    const t0 = Date.now();
    const res = SQLSim.rodar(sqlite3, seed, sql);
    const ms = Date.now() - t0;
    if (res.erro && res.erro.seed) throw new Error(res.erro.msg);
    if (ms > 1500 && !(res.erro && res.erro.msg === "interrupted"))
      itens.push({ grav: "aviso", linha: onde.linha, msg: onde.nome + ": levou " + ms + " ms para rodar (a trava do editor é " + SQLSim.tempoMax + " ms)" });
    for (const it of res.itens)
      if (it.tipo === "select" && it.linhas.length > 500)
        itens.push({ grav: "aviso", linha: onde.linha, msg: onde.nome + ": um SELECT devolveu " + it.linhas.length + " linhas (o editor só desenha 500)" });
    if (nativo) {
      nDifComparados++;
      const d = compararNativo(sql, res);
      if (d) {
        difs.push({ onde: onde.nome + " (linha " + onde.linha + ")", sql, res, motivo: d.motivo, nativo: d.nativo || { stdout: "", stderr: "", status: "?" } });
        itens.push({ grav: "aviso", linha: onde.linha, msg: onde.nome + ": DIFERENÇA com o sqlite3 nativo (" + d.motivo + ") — veja tools/DIFERENCAS.md" });
      }
    }
    return res;
  }
  const curto = (s) => s.length > 90 ? s.slice(0, 87) + "…" : s;

  caixas.forEach((cx, k) => {
    const nome = "caixa " + (k + 1);
    const L = cx.linha;
    const goal = cx.goal;
    const fal = (msg) => itens.push({ grav: "FALHA", linha: L, msg: nome + ": " + msg });
    if (!cx.script.length) { fal('sem <pre class="script"> (o SQL inicial da caixa)'); return; }
    if (cx.script.length > 1) fal('tem ' + cx.script.length + ' <pre class="script"> (o editor só usa o primeiro)');
    if (cx.solucao.length > 1) fal('tem ' + cx.solucao.length + ' <pre class="solucao"> (o editor só usa o primeiro)');
    const inicial = textoPre(cx.script[0].cru);
    const solucao = cx.solucao.length ? textoPre(cx.solucao[0].cru) : null;

    if (goal === undefined || goal.trim() === "") {
      if (goal !== undefined) itens.push({ grav: "aviso", linha: L, msg: nome + ': data-goal vazio (tire o atributo para uma caixa livre)' });
      const r = rodar(inicial, { nome: nome + ", SQL inicial", linha: L });
      if (r.erro && !cx.erroOk) { fal("o SQL inicial dá erro: " + r.erro.msg + ' (se é de propósito, ponha data-erro na <div class="trysql">)'); return; }
      if (!r.erro && cx.erroOk) { fal("tem data-erro mas o SQL inicial rodou sem erro"); return; }
      if (solucao !== null) {
        const rs = rodar(solucao, { nome: nome + ", solução", linha: cx.solucao[0].linha });
        if (rs.erro) { fal("a solução dá erro: " + rs.erro.msg); return; }
      }
      itens.push({ grav: "ok", linha: L, msg: nome + " (livre): roda" + (r.erro ? " (com o erro esperado: " + r.erro.msg + ")" : " sem erro") });
      return;
    }

    // missão
    const metas = SQLSim.dividirMetas(goal).map(SQLSim.analisarMeta);
    const ruins = metas.filter((a) => a.erro);
    if (ruins.length) { ruins.forEach((a) => fal(a.erro)); return; }
    if (solucao === null) { fal('missão (data-goal="' + goal + '") sem <pre class="solucao">'); return; }
    const ri = rodar(inicial, { nome: nome + ", SQL inicial", linha: L });
    const fi = SQLSim.avaliarMetas(goal, ri);
    const rs = rodar(solucao, { nome: nome + ", solução", linha: cx.solucao[0].linha });
    const fs_ = SQLSim.avaliarMetas(goal, rs);
    let ok = true;
    if (fi.every((x) => x.ok)) { ok = false; fal('o SQL inicial JÁ cumpre a meta "' + goal + '" (a missão não pede nada; mude o inicial ou a meta)'); }
    fs_.filter((x) => !x.ok).forEach((x) => { ok = false; fal('a solução NÃO cumpre "' + x.meta + '": ' + x.motivo); });
    if (ok) itens.push({ grav: "ok", linha: L, msg: nome + ' (missão "' + curto(goal) + '"): o inicial falha (' +
      curto(fi.filter((x) => !x.ok).map((x) => x.motivo).join("; ")) + "), a solução cumpre" });
  });

  resultados.forEach((r, k) => {
    const nome = "resultado " + (k + 1);
    if (!r.codigo.trim()) { itens.push({ grav: "FALHA", linha: r.linha, msg: nome + ": pre.file[data-resultado] vazio" }); return; }
    const res = rodar(r.codigo, { nome, linha: r.linha });
    if (res.erro && !r.erroOk) itens.push({ grav: "FALHA", linha: r.linha, msg: nome + ": o SQL dá erro: " + res.erro.msg + " (se é um exemplo de erro de propósito, ponha data-erro no <pre>)" });
    else if (!res.erro && r.erroOk) itens.push({ grav: "FALHA", linha: r.linha, msg: nome + ": tem data-erro mas rodou sem erro" });
    else {
      const desc = res.itens.map((x) => x.tipo === "select" ? linhasDe(x.linhas.length) :
        x.tipo === "mudanca" ? x.verbo + " " + x.n : x.verbo).join(" + ");
      itens.push({ grav: "ok", linha: r.linha, msg: nome + ": " + (desc || "nada") + (res.erro ? (desc ? ", depois " : "") + "erro esperado: " + res.erro.msg : "") });
    }
  });

  if (!caixas.length && !resultados.length)
    itens.push({ grav: "aviso", linha: 1, msg: "a página não tem nenhuma caixa .trysql nem pre.file[data-resultado]" });
  else if (caixas.length && !caixas.some((c) => c.goal && c.goal.trim()))
    itens.push({ grav: "aviso", linha: 1, msg: "nenhuma caixa é missão (data-goal); a §2 pede uma missão no fim da aula" });

  if (nativo) gravarDiferencas(nomePag, difs);
  return { itens: itens.sort((a, b) => a.linha - b.linha), nDif: difs.length, nDifComparados };
}

/* ------------------------------------------------------------- principal */
function achar(p) {
  const cands = [p, path.join(RAIZ, p), path.join(RAIZ, path.basename(p))];
  return cands.find((c) => fs.existsSync(c) && fs.statSync(c).isFile());
}

pronto().then((motor) => {
  if (nativo) {
    if (!fs.existsSync(NATIVO_BIN)) { console.error("não achei o sqlite3 nativo em " + NATIVO_BIN); process.exit(2); }
    seedPath = path.join(RAIZ, "assets/sql/aurora.sql");
  }
  let totFalha = 0, totAviso = 0, totOk = 0, faltando = 0, totDif = 0;
  const ruins = [];
  for (const p of paginas) {
    const arq = achar(p);
    console.log("== " + p);
    if (!arq) { console.log("  FALHA  página não encontrada (mandou com o enviar?)"); faltando++; ruins.push(p); continue; }
    let r;
    try { r = testarPagina(arq, motor); }
    catch (e) { console.log("  FALHA  erro do testador: " + (e.stack || e)); totFalha++; ruins.push(p); continue; }
    const c = { ok: 0, FALHA: 0, aviso: 0 };
    for (const it of r.itens) {
      c[it.grav]++;
      if (quieto && it.grav === "ok") continue;
      console.log("  " + (it.grav + "      ").slice(0, 6) + " linha " + it.linha + ": " + it.msg);
    }
    console.log("  -> " + c.ok + " ok, " + c.FALHA + " FALHA, " + c.aviso + " aviso" +
      (nativo ? "; nativo: " + r.nDifComparados + " SQL comparados, " + r.nDif + " diferença(s)" : ""));
    totOk += c.ok; totFalha += c.FALHA; totAviso += c.aviso; totDif += r.nDif;
    if (c.FALHA) ruins.push(p);
  }
  if (paginas.length > 1)
    console.log("\nTOTAL: " + paginas.length + " página(s), " + totOk + " ok, " + totFalha + " FALHA, " + totAviso + " aviso" +
      (nativo ? ", " + totDif + " diferença(s) com o nativo" : "") + (ruins.length ? "\ncom FALHA: " + ruins.join(" ") : ""));
  if (nativo && totDif) console.log("diferenças registradas em tools/DIFERENCAS.md");
  process.exitCode = faltando ? 2 : totFalha ? 1 : 0;
}).catch((e) => { console.error("erro ao carregar o motor: " + (e.stack || e)); process.exitCode = 2; });
