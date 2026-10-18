#!/usr/bin/env node
// testar-navegador.js — abre páginas do Guia SQL num Chromium headless (na VPS) e confere o editor.
//
//   timeout 600 node tools/testar-navegador.js pagina.html [outra.html…]
//   timeout 900 node tools/testar-navegador.js --todas          (todas as .html da raiz)
//   --fotos DIR   salva um print de página inteira de cada uma em DIR (claro e escuro)
//   -q            mostra só as páginas com problema (e o resumo)
//
// Sobe um servidor HTTP estático próprio em 127.0.0.1 (porta livre escolhida pelo sistema;
// morre junto com o script) porque o wasm não carrega de file://.
// Em cada página: erro de JS/console/HTTP = problema; menu montado; cada .trysql montada;
// SQLSim.caixas[i].testar("solucao") em toda caixa (missão: metas passam; livre: sem erro, a
// não ser com data-erro) e testar("inicial") nas missões (a meta NÃO pode passar); cada
// pre.file[data-resultado] desenhado de verdade (rolando a página até ele: o caminho
// preguiçoso real), com tabela/mensagem, e erro só com data-erro.
// Na simulador-teste-interno.html roda também o teste de interface (cliques de verdade).
// Código de saída: 0 = tudo ok; 1 = alguma página com problema; 2 = uso errado.
"use strict";
const fs = require("fs");
const path = require("path");
const http = require("http");
const os = require("os");

const RAIZ = path.join(__dirname, "..");
const PUP = process.env.PUPPETEER_DIR || path.join(os.homedir(), "rascunho/coord/cdp/node_modules/puppeteer-core");
const CHROMIUM = process.env.CHROMIUM || "/usr/bin/chromium";

const args = process.argv.slice(2);
let fotos = null, quieto = false;
const paginas = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--todas") fs.readdirSync(RAIZ).filter((f) => /\.html$/.test(f)).sort().forEach((f) => paginas.push(f));
  else if (a === "--fotos") fotos = path.resolve(args[++i] || "fotos");
  else if (a === "-q") quieto = true;
  else if (a.startsWith("-")) { console.error("opção desconhecida: " + a); process.exit(2); }
  else paginas.push(fs.existsSync(path.join(RAIZ, a)) ? a : path.basename(a));
}
if (!paginas.length) {
  console.error("uso: timeout 600 node tools/testar-navegador.js [--fotos DIR] [-q] pagina.html…|--todas");
  process.exit(2);
}
if (fotos) fs.mkdirSync(fotos, { recursive: true });

/* ------------------------------------------------------ servidor estático */
const TIPOS = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".wasm": "application/wasm", ".sql": "text/plain; charset=utf-8", ".md": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".json": "application/json",
  ".ico": "image/x-icon", ".db": "application/octet-stream", ".txt": "text/plain; charset=utf-8" };
function servidor() {
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (p.endsWith("/")) p += "index.html";
    const arq = path.join(RAIZ, path.normalize(p).replace(/^(\.\.[/\\])+/, ""));
    if (!arq.startsWith(RAIZ) || !fs.existsSync(arq) || !fs.statSync(arq).isFile()) { res.writeHead(404); res.end("404"); return; }
    res.writeHead(200, { "Content-Type": TIPOS[path.extname(arq)] || "application/octet-stream", "Cache-Control": "no-store" });
    fs.createReadStream(arq).pipe(res);
  });
  return new Promise((ok) => srv.listen(0, "127.0.0.1", () => ok(srv)));
}

/* ------------------------------------------------- o teste de cada página */
async function testarPagina(nav, base, pagina) {
  const pg = await nav.newPage();
  const erros = [], problemas = [], notas = [];
  await pg.setViewport({ width: 1280, height: 900 });
  pg.on("pageerror", (e) => erros.push("JS: " + e.message));
  pg.on("console", (m) => { if (m.type() === "error" && !/favicon|Failed to load resource/.test(m.text())) erros.push("console: " + m.text()); });
  pg.on("requestfailed", (r) => { if (!/favicon/.test(r.url())) erros.push("falhou: " + r.url() + " " + (r.failure() || {}).errorText); });
  pg.on("response", (r) => { if (r.status() >= 400 && !/favicon/.test(r.url())) erros.push("HTTP " + r.status() + ": " + r.url().replace(base, "")); });
  pg.on("dialog", (d) => { erros.push("diálogo inesperado: " + d.message()); d.dismiss().catch(() => {}); });
  try {
    await pg.goto(base + pagina, { waitUntil: "load", timeout: 30000 });
    const temEditor = await pg.evaluate(() => !!document.querySelector(".trysql, pre.file[data-resultado]"));
    if (temEditor) await pg.waitForFunction(() => window.SQLSim && window.SQLSim.montado, { timeout: 20000 });
    const info = await pg.evaluate(() => ({
      menu: document.querySelectorAll(".sidebar a").length,
      h1: document.querySelectorAll("h1").length,
      caixas: document.querySelectorAll(".trysql").length,
      montadas: document.querySelectorAll(".trysql[data-montado] .ts.sqlsim").length,
      resultados: document.querySelectorAll("pre.file[data-resultado]").length,
    }));
    if (info.menu < 50) problemas.push("menu com " + info.menu + " links (site.js não montou?)");
    if (info.h1 !== 1) problemas.push(info.h1 + " h1 na página");
    if (info.montadas !== info.caixas) problemas.push("caixas montadas " + info.montadas + "/" + info.caixas);

    // cada caixa: solução (e inicial, nas missões)
    for (let i = 0; i < info.montadas; i++) {
      const r = await pg.evaluate(async (i) => {
        const c = SQLSim.caixas[i], box = c.box, ehMissao = !!c.goal, erroOk = box.hasAttribute("data-erro");
        const temSol = !!box.querySelector("pre.solucao");
        const out = { id: box.id || "", linha: i + 1, missao: ehMissao, falhas: [] };
        const desenhou = () => {
          const s = box.querySelector(".sql-saida");
          return s && !s.hidden && !!s.querySelector("table.sql-result, .sql-msg, .sql-erro") && !/Carregando/.test(s.textContent);
        };
        if (ehMissao) {
          const ini = await c.testar("inicial");
          if (!ini.res) out.falhas.push("o inicial não rodou (motor não carregou?)");
          else if (ini.metas.every((m) => m.ok)) out.falhas.push("o inicial já cumpre a meta");
          if (!desenhou()) out.falhas.push("o inicial não desenhou resultado");
        }
        if (!ehMissao && !temSol) {
          const ini = await c.testar("inicial");
          if (!ini.res) out.falhas.push("não rodou (motor não carregou?)");
          else if (ini.res.erro && !erroOk) out.falhas.push("o SQL dá erro: " + ini.res.erro.msg);
          if (!desenhou()) out.falhas.push("não desenhou resultado");
          if (ini.res && ini.res.erro && !box.querySelector(".sql-saida .sql-erro")) out.falhas.push("deu erro mas o quadro vermelho não apareceu");
          return out;
        }
        const sol = await c.testar("solucao");
        if (!sol.res) out.falhas.push("a solução não rodou (motor não carregou?)");
        else if (ehMissao) {
          sol.metas.filter((m) => !m.ok).forEach((m) => out.falhas.push('a solução não cumpre "' + m.meta + '": ' + m.motivo));
          const st = box.querySelector(".sim-status");
          if (!st || !st.classList.contains("ok")) out.falhas.push('o aviso "Missão cumprida" não apareceu');
        } else if (sol.res.erro && !erroOk) out.falhas.push("a solução dá erro: " + sol.res.erro.msg);
        if (!desenhou()) out.falhas.push("a solução não desenhou resultado");
        return out;
      }, i);
      r.falhas.forEach((f) => problemas.push("caixa " + (i + 1) + (r.id ? " #" + r.id : "") + ": " + f));
    }

    // os quadros Resultado: rola até cada um (o caminho preguiçoso de verdade)
    if (info.resultados) {
      const n = info.resultados;
      for (let i = 0; i < n; i++) {
        await pg.evaluate((i) => document.querySelectorAll("pre.file[data-resultado]")[i].scrollIntoView({ block: "center" }), i);
        await new Promise((r) => setTimeout(r, 30));
      }
      try {
        await pg.waitForFunction(() => SQLSim.resultados.length && SQLSim.resultados.every((r) => r.pronto), { timeout: 15000 });
      } catch (e) { problemas.push("algum quadro Resultado não começou a desenhar depois de rolar a página"); }
      const rs = await pg.evaluate(async () => {
        await Promise.all(SQLSim.resultados.map((r) => r.desenhar()));
        return SQLSim.resultados.map((r, i) => {
          const quadro = r.pre.nextElementSibling;
          const saida = quadro && quadro.classList.contains("sql-res") ? quadro.querySelector(".sql-saida") : null;
          const erroOk = r.pre.hasAttribute("data-erro");
          const f = [];
          if (!saida) f.push("o quadro Resultado não foi inserido logo depois do pre");
          else {
            if (/Carregando/.test(saida.textContent)) f.push("ficou em Carregando…");
            const temErro = !!saida.querySelector(".sql-erro");
            if (temErro && !erroOk) f.push("mostrou erro: " + saida.querySelector(".sql-erro").textContent);
            if (!temErro && erroOk) f.push("tem data-erro mas não mostrou erro");
            if (!saida.querySelector("table.sql-result, .sql-msg, .sql-erro")) f.push("não desenhou nada");
          }
          return { i: i + 1, id: r.pre.id || "", f };
        });
      });
      rs.forEach((r) => r.f.forEach((f) => problemas.push("resultado " + r.i + (r.id ? " #" + r.id : "") + ": " + f)));
    }

    if (await pg.evaluate(() => document.body.id === "teste-interno")) {
      const r = await testeInterface(pg);
      r.problemas.forEach((x) => problemas.push("interface: " + x));
      r.notas.forEach((x) => notas.push(x));
    }

    if (fotos) {
      const nome = pagina.replace(/\.html$/, "");
      await pg.evaluate(() => window.scrollTo(0, 0));
      await pg.screenshot({ path: path.join(fotos, nome + ".png"), fullPage: true });
      await pg.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
      await pg.screenshot({ path: path.join(fotos, nome + "-escuro.png"), fullPage: true });
    }
    return { info, erros, problemas, notas };
  } finally { await pg.close(); }
}

/* --------------------------- teste de interface (simulador-teste-interno) */
async function testeInterface(pg) {
  const problemas = [], notas = [];
  const P = (cond, msg) => { if (!cond) problemas.push(msg); };
  const sel = (id, s) => "#" + id + " " + s;
  const esperar = (fn, arg, ms = 15000) => pg.waitForFunction(fn, { timeout: ms }, arg).then(() => true, () => false);
  const saidaPronta = (id) => esperar((id) => {
    const s = document.querySelector("#" + id + " .sql-saida");
    return s && !s.hidden && !/Carregando/.test(s.textContent) && s.innerHTML.length > 0 &&
      !document.querySelector("#" + id + " .ts-rodar").disabled;
  }, id);

  // tudo do zero: recarrega (as caixas já foram usadas pelo teste genérico)
  await pg.reload({ waitUntil: "load" });
  await pg.waitForFunction(() => window.SQLSim && SQLSim.montado, { timeout: 20000 });
  let t0l = await pg.evaluate(() => document.querySelector("#res-longe").nextElementSibling.innerText);
  P(/Carregando/.test(t0l), "res-longe: desenhou antes de chegar perto da tela (o desenho preguiçoso não funcionou): " + JSON.stringify(t0l));

  // 1. Rodar de verdade: tabela, cabeçalho, NULL
  await pg.click(sel("cx-livre", ".ts-rodar"));
  P(await saidaPronta("cx-livre"), "cx-livre: Rodar não terminou");
  let t = await pg.evaluate(() => {
    const b = document.querySelector("#cx-livre");
    return {
      th: [...b.querySelectorAll("table.sql-result th")].map((x) => x.textContent),
      nulls: b.querySelectorAll("table.sql-result em.sql-null").length,
      n: (b.querySelector(".sql-n") || {}).textContent,
      linhas: b.querySelectorAll("table.sql-result tbody tr").length,
    };
  });
  P(t.th.join(",") === "nome,email", "cx-livre: cabeçalho " + t.th.join(","));
  P(t.nulls === 1, "cx-livre: NULL em itálico " + t.nulls + " (esperava 1: cliente 7 sem email)");
  P(t.linhas === 2 && t.n === "2 linhas", "cx-livre: " + t.linhas + " linhas / rodapé " + t.n);

  // 2. editar + Ctrl+Enter
  const ta = sel("cx-livre", "textarea.ts-code");
  await pg.click(ta);
  await pg.evaluate((s) => { const x = document.querySelector(s); x.select(); }, ta);
  await pg.keyboard.type("SELECT 42 AS resposta;\nSELECT 'ok'");
  const nums = await pg.evaluate(() => document.querySelector("#cx-livre .ts-nums").textContent.trim().split("\n").length);
  P(nums === 2, "cx-livre: números de linha = " + nums + " (esperava 2)");
  await pg.keyboard.down("Control"); await pg.keyboard.press("Enter"); await pg.keyboard.up("Control");
  P(await esperar(() => /resposta/.test(document.querySelector("#cx-livre .sql-saida").textContent)), "cx-livre: Ctrl+Enter não rodou");
  t = await pg.evaluate(() => [...document.querySelectorAll("#cx-livre table.sql-result")].map((x) => x.textContent));
  P(t.length === 2 && /42/.test(t[0]) && /ok/.test(t[1]), "cx-livre: Ctrl+Enter com 2 SELECTs desenhou " + JSON.stringify(t));
  // Tab vira dois espaços
  await pg.keyboard.press("Tab");
  t = await pg.evaluate((s) => document.querySelector(s).value, ta);
  P(/'ok' {2}$/.test(t), "cx-livre: Tab não inseriu 2 espaços (" + JSON.stringify(t.slice(-8)) + ")");
  // 3. Restaurar
  await pg.click(sel("cx-livre", ".ts-rest"));
  t = await pg.evaluate(() => ({ v: document.querySelector("#cx-livre textarea").value, h: document.querySelector("#cx-livre .sql-saida").hidden }));
  P(t.v.startsWith("SELECT nome, email") && t.h, "cx-livre: Restaurar não voltou ao original / não escondeu a saída");

  // 4. Ver solução: confirmar, cancelar, sim
  await pg.click(sel("cx-missao", ".ts-rodar"));
  await saidaPronta("cx-missao");
  t = await pg.evaluate(() => document.querySelector("#cx-missao .sim-status").textContent);
  P(/Ainda falta/.test(t) && /30 linhas/.test(t), "cx-missao: status depois do inicial: " + t);
  await pg.click(sel("cx-missao", ".ts-sol"));
  P(await pg.evaluate(() => !document.querySelector("#cx-missao .ts-confirma").hidden), "cx-missao: Ver solução não pediu confirmação");
  await pg.click(sel("cx-missao", ".ts-nao"));
  t = await pg.evaluate(() => ({ c: document.querySelector("#cx-missao .ts-confirma").hidden, v: document.querySelector("#cx-missao textarea").value }));
  P(t.c && t.v === "SELECT nome FROM clientes;", "cx-missao: Cancelar mexeu no código ou não fechou");
  await pg.click(sel("cx-missao", ".ts-sol"));
  await pg.click(sel("cx-missao", ".ts-sim"));
  P(await esperar(() => document.querySelector("#cx-missao .sim-status").classList.contains("ok")), "cx-missao: Sim, mostrar não cumpriu a missão");
  t = await pg.evaluate(() => ({ v: document.querySelector("#cx-missao textarea").value, s: document.querySelector("#cx-missao .sim-status").textContent,
    n: document.querySelectorAll("#cx-missao table.sql-result tbody tr").length }));
  P(/NOT IN/.test(t.v) && /cumprida/.test(t.s) && t.n === 4, "cx-missao: solução " + JSON.stringify(t));

  // 5. erro em vermelho, o que rodou antes continua, o depois não roda
  await pg.click(sel("cx-erro", ".ts-rodar"));
  await saidaPronta("cx-erro");
  t = await pg.evaluate(() => {
    const s = document.querySelector("#cx-erro .sql-saida"), e = s.querySelector(".sql-erro");
    const cor = e ? getComputedStyle(e).color : "", fundo = e ? getComputedStyle(e).backgroundColor : "";
    return { tabelas: s.querySelectorAll("table.sql-result").length, msg: e ? e.textContent : "", cor, fundo, nunca: /nunca roda/.test(s.textContent) };
  });
  const rgb = (c) => (c.match(/\d+(\.\d+)?/g) || []).map(Number);
  const [r, g, b] = rgb(t.cor);
  P(t.msg === "Erro do SQLite: no such table: cliente", "cx-erro: mensagem " + JSON.stringify(t.msg));
  P(r > g + 60 && r > b + 60, "cx-erro: a cor do erro não é vermelha: " + t.cor);
  P(t.tabelas === 1 && !t.nunca, "cx-erro: devia mostrar 1 tabela antes do erro e parar (" + t.tabelas + ", nunca=" + t.nunca + ")");
  notas.push("erro: cor " + t.cor + " sobre " + t.fundo);

  // 6. comando de ponto
  await pg.click(sel("cx-ponto", ".ts-rodar"));
  await saidaPronta("cx-ponto");
  t = await pg.evaluate(() => document.querySelector("#cx-ponto .sql-erro") && document.querySelector("#cx-ponto .sql-erro").textContent);
  P(t === 'Erro do SQLite: near ".": syntax error', "cx-ponto: " + t);

  // 7. várias instruções
  await pg.click(sel("cx-varios", ".ts-rodar"));
  await saidaPronta("cx-varios");
  t = await pg.evaluate(() => [...document.querySelectorAll("#cx-varios .sql-saida > *")].map((x) => x.className + ":" + x.textContent.replace(/\s+/g, " ").slice(0, 60)));
  const esperado = ["sql-msg:CREATE TABLE: ok", "sql-msg:INSERT: 2 linhas afetadas", "sql-msg:UPDATE: 1 linha afetada"];
  P(esperado.every((e, i) => t[i] === e) && /^sql-result-wrap/.test(t[3]) && /^sql-n:2 linhas/.test(t[4]) && t[5] === "sql-msg:DROP TABLE: ok",
    "cx-varios: desenhou " + JSON.stringify(t));

  // 8. mais de 500 linhas + escape do HTML vindo do banco
  await pg.click(sel("cx-grande", ".ts-rodar"));
  await saidaPronta("cx-grande");
  t = await pg.evaluate(() => {
    const b = document.querySelector("#cx-grande");
    return { tr: b.querySelectorAll("tbody tr").length, n: b.querySelector(".sql-n").textContent, negrito: b.querySelectorAll("td b").length,
      txt: b.querySelector("tbody td:nth-child(2)").textContent };
  });
  P(t.tr === 500 && /600 linhas \(mostrando as 500 primeiras\)/.test(t.n), "cx-grande: " + t.tr + " tr / " + t.n);
  P(t.negrito === 0 && t.txt === "<b>não é negrito</b>", "cx-grande: o texto do banco virou HTML: " + JSON.stringify(t));

  // 9. a trava anti-loop (e o botão bloqueado enquanto roda)
  const t0 = Date.now();
  await pg.click(sel("cx-trava", ".ts-rodar"));
  const ok = await esperar(() => /interrupted/.test(document.querySelector("#cx-trava .sql-saida").textContent), null, 20000);
  const ms = Date.now() - t0;
  P(ok, "cx-trava: não apareceu interrupted em 20 s");
  P(await pg.evaluate(() => /parou este SQL/.test(document.querySelector("#cx-trava .sql-saida").textContent)), "cx-trava: sem a explicação em português da trava");
  P(ms < 9000, "cx-trava: levou " + ms + " ms");
  notas.push("trava: interrupted em " + ms + " ms");
  t = await pg.evaluate(() => document.querySelector("#cx-trava .ts-rodar").disabled);
  P(!t, "cx-trava: o botão Rodar ficou desabilitado depois");

  // 10. a página continua viva depois da trava
  await pg.click(sel("cx-livre", ".ts-rodar"));
  P(await saidaPronta("cx-livre"), "depois da trava, cx-livre não roda mais");

  // 11. quadros Resultado: o de longe só desenha quando chega perto
  await pg.evaluate(() => document.querySelector("#res-longe").scrollIntoView());
  P(await esperar(() => /total/.test(document.querySelector("#res-longe").nextElementSibling.textContent)), "res-longe: não desenhou ao rolar");
  t = await pg.evaluate(() => document.querySelector("#res-longe").nextElementSibling.innerText.replace(/\s+/g, " "));
  P(/total 5 1 linha/i.test(t), "res-longe: " + t);
  t = await pg.evaluate(() => ["res-select", "res-dml", "res-erro"].map((id) => document.querySelector("#" + id).nextElementSibling.innerText.replace(/\s+/g, " ").trim()));
  P(/^Resultado nome preco Lápis Grafite HB 1\.15/i.test(t[0]), "res-select: " + t[0]);
  P(/^Resultado UPDATE: 6 linhas afetadas DELETE: 3 linhas afetadas$/i.test(t[1]), "res-dml: " + t[1]);
  P(/^Resultado Erro do SQLite: no such table: cliente$/i.test(t[2]), "res-erro: " + t[2]);
  notas.push("res-dml: " + t[1]);
  // o botão copiar do pre.file não pode entrar no SQL
  t = await pg.evaluate(() => SQLSim.resultados.map((r) => r.codigo).join("\n---\n"));
  P(!/copiar/.test(t), "o texto do botão copiar entrou no SQL do quadro");
  return { problemas, notas };
}

/* --------------------------------------------------------------- principal */
(async () => {
  let puppeteer;
  try { puppeteer = require(PUP); } catch (e) { console.error("não achei o puppeteer-core em " + PUP); process.exit(2); }
  const srv = await servidor();
  const base = "http://127.0.0.1:" + srv.address().port + "/";
  const nav = await puppeteer.launch({ executablePath: CHROMIUM, headless: true, args: ["--no-sandbox", "--disable-gpu"] });
  let ruins = 0;
  try {
    for (const p of paginas) {
      if (!fs.existsSync(path.join(RAIZ, p))) { console.log("✗ " + p + "  página não existe em " + RAIZ); ruins++; continue; }
      const t0 = Date.now();
      let r;
      try { r = await testarPagina(nav, base, p); }
      catch (e) { r = { info: {}, erros: [], problemas: ["o teste quebrou: " + e.message], notas: [] }; }
      const ruim = r.erros.length || r.problemas.length;
      if (ruim) ruins++;
      if (ruim || !quieto) {
        const i = r.info;
        console.log((ruim ? "✗ " : "✓ ") + p + "  caixas=" + (i.montadas ?? "?") + "/" + (i.caixas ?? "?") + " resultados=" + (i.resultados ?? "?") +
          "  (" + ((Date.now() - t0) / 1000).toFixed(1) + " s)");
        r.erros.concat(r.problemas).forEach((x) => console.log("    " + x));
        if (!quieto) r.notas.forEach((x) => console.log("    · " + x));
      }
    }
  } finally {
    await nav.close();
    srv.close();
  }
  console.log("\n" + paginas.length + " página(s), " + ruins + " com problema" + (fotos ? "; prints em " + fotos : ""));
  process.exitCode = ruins ? 1 : 0;
})().catch((e) => { console.error(e); process.exitCode = 1; process.exit(1); });
