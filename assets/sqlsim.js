/* =====================================================================
   sqlsim.js — o editor "Experimente" do Guia SQL.
   SQLite DE VERDADE (build WASM oficial, assets/sql/) rodando no
   navegador do leitor. Nada sai da máquina de quem estuda.

   Monta:
     <div class="trysql" data-goal="…">     editor com o SQL da caixa
       <p class="try-task">…</p>            a missão (opcional)
       <pre class="script" data-file="consulta.sql">SELECT …</pre>
       <pre class="solucao">…</pre>         a solução (obrigatória com data-goal)
     <pre class="file" data-resultado>      o quadro "Resultado" logo abaixo

   Cada "Rodar" cria um banco NOVO em memória, carrega a Loja Aurora
   (assets/sql/aurora.sql) e executa o SQL do leitor: determinístico.

   As metas (data-goal) são avaliadas pelo mesmo código aqui e no
   testador (tools/testar-missoes.js); o contrato está no CONTRIBUINDO.md,
   seção "Metas do .trysql".
   ===================================================================== */
(function (global) {
  "use strict";
  var S = { versao: "1", seedUrl: "assets/sql/aurora.sql", tempoMax: 4000, maxGuardar: 20000 };
  var EH_NAVEGADOR = typeof document !== "undefined";

  /* =====================================================================
     1. Rodar SQL num banco limpo (puro: recebe o módulo sqlite3)
     → { itens, erro, canonico, ultimo, estado }
        itens:  [{tipo:"select", colunas, linhas}, {tipo:"mudanca", verbo, n},
                 {tipo:"ok", verbo}]  (na ordem em que os comandos rodaram)
        erro:   null ou { msg }      (a mensagem REAL do SQLite)
        canonico: as linhas de todos os SELECTs em "valor|valor|…"
                  (o formato do sqlite3 .mode list; NULL vira vazio)
        ultimo: o último item "select", ou null
        estado: { tabelas: { nome_minusculo: nº de linhas } } após rodar
     ===================================================================== */
  function verboDe(sql) {
    var s = String(sql || "");
    for (;;) {
      var s2 = s.replace(/^(\s+|--[^\n]*(\n|$)|\/\*[\s\S]*?\*\/)/, "");
      if (s2 === s) break;
      s = s2;
    }
    var m = /^([A-Za-z]+)(\s+([A-Za-z]+))?/.exec(s);
    if (!m) return "";
    var v = m[1].toUpperCase();
    if (/^(CREATE|DROP|ALTER)$/.test(v) && m[3]) v += " " + m[3].toUpperCase();
    return v;
  }
  S.verboDe = verboDe;

  function rodar(sqlite3, seed, sql) {
    var capi = sqlite3.capi, wasm = sqlite3.wasm;
    var res = { itens: [], erro: null, canonico: "", ultimo: null, estado: { tabelas: {} } };
    var db = new sqlite3.oo1.DB(":memory:");
    var inicio = Date.now(), parou = false;
    try {
      try { db.exec(String(seed || "")); }
      catch (e) { res.erro = { msg: "no banco de exemplo (aurora.sql): " + e.message, seed: true }; return res; }

      // trava de segurança: um SQL sem fim (WITH RECURSIVE sem LIMIT…) é interrompido
      try {
        capi.sqlite3_progress_handler(db, 5000, function () {
          if (Date.now() - inicio > S.tempoMax) { parou = true; return 1; }
          return 0;
        }, 0);
      } catch (e) { /* sem progress handler, segue sem a trava */ }

      var scope = wasm.scopedAllocPush();
      try {
        var ppStmt = wasm.scopedAlloc(8), pzTail = ppStmt + 4;
        // sem o espaço/quebra do fim (como o sqlite3 faz): senão uma aspa sem fechar
        // engole o \n final e a mensagem sai partida em duas linhas
        var aloc = wasm.scopedAllocCString(String(sql || "").replace(/\s+$/, ""), true);
        var pSql = aloc[0], fim = aloc[0] + aloc[1];
        while (pSql && pSql < fim && wasm.peek(pSql, "i8")) {
          wasm.pokePtr(ppStmt, 0);
          wasm.pokePtr(pzTail, 0);
          var rc = capi.sqlite3_prepare_v3(db, pSql, fim - pSql, 0, ppStmt, pzTail);
          if (rc) { res.erro = { msg: capi.sqlite3_errmsg(db) }; break; }
          var pStmt = wasm.peekPtr(ppStmt);
          pSql = wasm.peekPtr(pzTail);
          if (!pStmt) continue; // só espaço ou comentário
          var verbo = verboDe(capi.sqlite3_sql(pStmt));
          var nCol = capi.sqlite3_column_count(pStmt);
          var rc2, erroMsg = null;
          if (nCol > 0) {
            var colunas = [], linhas = [], total = 0;
            for (var i = 0; i < nCol; i++) colunas.push(capi.sqlite3_column_name(pStmt, i));
            while ((rc2 = capi.sqlite3_step(pStmt)) === capi.SQLITE_ROW) {
              // conta todas as linhas, mas só guarda as primeiras (um SQL sem fim gera milhões até a trava)
              if (++total > S.maxGuardar) continue;
              var linha = [];
              for (var c = 0; c < nCol; c++)
                linha.push(capi.sqlite3_column_type(pStmt, c) === capi.SQLITE_NULL ? null : capi.sqlite3_column_text(pStmt, c));
              linhas.push(linha);
            }
            if (rc2 !== capi.SQLITE_DONE) erroMsg = capi.sqlite3_errmsg(db);
            capi.sqlite3_finalize(pStmt);
            // um SELECT que deu erro antes da 1ª linha não desenha tabela vazia (como o CLI)
            if (!erroMsg || linhas.length) {
              res.itens.push({ tipo: "select", verbo: verbo, colunas: colunas, linhas: linhas, total: total });
              res.ultimo = res.itens[res.itens.length - 1];
            }
          } else {
            rc2 = capi.sqlite3_step(pStmt);
            if (rc2 !== capi.SQLITE_DONE && rc2 !== capi.SQLITE_ROW) erroMsg = capi.sqlite3_errmsg(db);
            capi.sqlite3_finalize(pStmt);
            if (!erroMsg) {
              if (/^(INSERT|UPDATE|DELETE|REPLACE)$/.test(verbo)) res.itens.push({ tipo: "mudanca", verbo: verbo, n: capi.sqlite3_changes(db) });
              else res.itens.push({ tipo: "ok", verbo: verbo });
            }
          }
          if (erroMsg) { res.erro = { msg: erroMsg }; if (parou) res.erro.trava = true; break; }
        }
      } finally { wasm.scopedAllocPop(scope); }

      // a saída canônica: todas as linhas dos SELECTs, estilo .mode list
      var cano = [];
      res.itens.forEach(function (it) {
        if (it.tipo !== "select") return;
        it.linhas.forEach(function (l) {
          cano.push(l.map(function (v) { return v === null ? "" : v; }).join("|"));
        });
      });
      res.canonico = cano.join("\n");

      // o estado das tabelas depois de rodar (para tabela: e mudou:)
      try {
        var nomes = [];
        db.exec({ sql: "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'", rowMode: "array", callback: function (r) { nomes.push(r[0]); } });
        nomes.forEach(function (n) {
          try { res.estado.tabelas[String(n).toLowerCase()] = db.selectValue('SELECT count(*) FROM "' + String(n).replace(/"/g, '""') + '"'); } catch (e) {}
        });
      } catch (e) {}
    } finally {
      try { db.close(); } catch (e) {}
    }
    return res;
  }
  S.rodar = rodar;

  /* =====================================================================
     2. Metas (data-goal) — contrato no CONTRIBUINDO.md
        out:REGEX  linhas:N  colunas:a,b,c  contem:TEXTO
        erro:      erro:REGEX  tabela:nome  mudou:tabela=N
        Várias metas separadas por ";;": todas precisam passar.
     ===================================================================== */
  var NOMES = ["out", "linhas", "colunas", "contem", "erro", "tabela", "mudou"];
  S.NOMES_METAS = NOMES;

  function dividirMetas(goal) {
    return String(goal || "").split(";;").map(function (m) { return m.trim(); }).filter(function (m) { return m !== ""; });
  }
  S.dividirMetas = dividirMetas;

  // divide "a,b\,c,d" em ["a", "b,c", "d"]  (\, é vírgula literal)
  function dividirVirgulas(v) {
    var r = [], cur = "";
    for (var i = 0; i < v.length; i++) {
      if (v[i] === "\\" && v[i + 1] === ",") { cur += ","; i++; continue; }
      if (v[i] === ",") { r.push(cur); cur = ""; continue; }
      cur += v[i];
    }
    r.push(cur);
    return r.map(function (x) { return x.trim(); });
  }

  function analisarMeta(m) {
    var i = m.indexOf(":"), tipo = (i < 0 ? m : m.slice(0, i)).trim(), v = i < 0 ? "" : m.slice(i + 1);
    var r = { meta: m, tipo: tipo, valor: v };
    if (NOMES.indexOf(tipo) < 0 || i < 0) { r.erro = 'meta desconhecida: "' + m + '" (use ' + NOMES.join(", ") + ")"; return r; }
    switch (tipo) {
      case "out":
        if (!v) { r.erro = "out: sem expressão"; break; }
        try { r.re = new RegExp(v); } catch (e) { r.erro = "out: regex inválida: " + e.message; }
        break;
      case "linhas":
        if (!/^\s*\d+\s*$/.test(v)) { r.erro = "linhas: use linhas:N (N é um número)"; break; }
        r.n = parseInt(v, 10); break;
      case "colunas":
        r.cols = dividirVirgulas(v);
        if (!v.trim()) r.erro = "colunas: sem nomes";
        break;
      case "contem":
        if (!v) r.erro = "contem: sem texto";
        break;
      case "erro":
        if (v) { try { r.re = new RegExp(v); } catch (e) { r.erro = "erro: regex inválida: " + e.message; } }
        break;
      case "tabela":
        if (!v.trim()) r.erro = "tabela: sem nome";
        r.nome = v.trim().toLowerCase(); break;
      case "mudou":
        var k = v.indexOf("=");
        if (k < 0 || !/^\s*\d+\s*$/.test(v.slice(k + 1)) || !v.slice(0, k).trim()) { r.erro = "mudou: use mudou:tabela=N"; break; }
        r.nome = v.slice(0, k).trim().toLowerCase(); r.n = parseInt(v.slice(k + 1), 10); break;
    }
    return r;
  }
  S.analisarMeta = analisarMeta;

  function descrever(a) {
    switch (a.tipo) {
      case "out": return "a saída precisa casar com /" + a.valor + "/";
      case "linhas": return "o último SELECT deve devolver " + a.n + (a.n === 1 ? " linha" : " linhas");
      case "colunas": return "as colunas do último SELECT devem ser " + (a.cols || []).join(", ");
      case "contem": return 'a saída deve conter "' + a.valor + '"';
      case "erro": return a.valor ? "o comando deve dar um erro casando com /" + a.valor + "/" : "o comando deve dar um erro";
      case "tabela": return 'a tabela "' + a.nome + '" deve existir depois de rodar';
      case "mudou": return 'a tabela "' + a.nome + '" deve ficar com ' + a.n + (a.n === 1 ? " linha" : " linhas");
    }
    return a.meta;
  }
  S.descrever = descrever;

  /* avalia todas as metas contra o resultado de rodar() → [{meta, tipo, ok, motivo, desc}] */
  function avaliarMetas(goal, res) {
    return dividirMetas(goal).map(function (m) {
      var a = analisarMeta(m), r = { meta: m, tipo: a.tipo, ok: false, motivo: "", desc: descrever(a) };
      if (a.erro) { r.motivo = a.erro; r.desc = a.erro; return r; }
      if (a.tipo === "erro") {
        if (!res.erro) r.motivo = "o SQL rodou sem erro";
        else if (a.re && !a.re.test(res.erro.msg)) r.motivo = 'o erro foi outro: "' + res.erro.msg + '"';
        else r.ok = true;
        return r;
      }
      if (res.erro) { r.motivo = "o SQL deu erro: " + res.erro.msg; return r; }
      var ult = res.ultimo;
      switch (a.tipo) {
        case "out":
          if (a.re.test(res.canonico)) r.ok = true; else r.motivo = "a saída de hoje não casa";
          break;
        case "linhas":
          var nl = ult ? (ult.total != null ? ult.total : ult.linhas.length) : 0;
          if (!ult) r.motivo = "não houve SELECT";
          else if (nl === a.n) r.ok = true;
          else r.motivo = "veio " + nl + (nl === 1 ? " linha" : " linhas");
          break;
        case "colunas":
          if (!ult) r.motivo = "não houve SELECT";
          else if (ult.colunas.join("\u0001") === a.cols.join("\u0001")) r.ok = true;
          else r.motivo = "vieram: " + ult.colunas.join(", ");
          break;
        case "contem":
          if (res.canonico.indexOf(a.valor) >= 0) r.ok = true; else r.motivo = "esse texto não apareceu";
          break;
        case "tabela":
          if (Object.prototype.hasOwnProperty.call(res.estado.tabelas, a.nome)) r.ok = true;
          else r.motivo = "ela não existe";
          break;
        case "mudou":
          if (!Object.prototype.hasOwnProperty.call(res.estado.tabelas, a.nome)) r.motivo = 'a tabela "' + a.nome + '" não existe';
          else if (res.estado.tabelas[a.nome] === a.n) r.ok = true;
          else r.motivo = "ela ficou com " + res.estado.tabelas[a.nome] + (res.estado.tabelas[a.nome] === 1 ? " linha" : " linhas");
          break;
      }
      return r;
    });
  }
  S.avaliarMetas = avaliarMetas;
  S.falhas = function (goal, res) { return avaliarMetas(goal, res).filter(function (x) { return !x.ok; }); };

  /* =====================================================================
     3. Só no Node: exporta e para por aqui
     ===================================================================== */
  if (!EH_NAVEGADOR) {
    if (typeof module !== "undefined" && module.exports) module.exports = S;
    return;
  }
  global.SQLSim = S;
  S.teste = /[?&]sqlsim-teste\b/.test(global.location ? global.location.search : "");

  /* =====================================================================
     4. Navegador: motor + seed, carregados uma vez só
     ===================================================================== */
  function escHtml(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function lerPre(pre) {
    var t = "";
    for (var c = pre.firstChild; c; c = c.nextSibling) {
      if (c.nodeType === 3) t += c.data;
      else if (c.nodeType === 1 && !c.classList.contains("copy-btn")) t += c.textContent;
    }
    return t.replace(/^\n/, "").replace(/\n$/, "");
  }
  S.lerPre = lerPre;
  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    for (var k in attrs || {}) e.setAttribute(k, attrs[k]);
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  var pMotor = null, pSeed = null;
  function motor() {
    if (pMotor) return pMotor;
    pMotor = new Promise(function (ok, falha) {
      var sc = document.createElement("script");
      sc.src = "assets/sql/sqlite3.js";
      sc.onload = function () {
        if (typeof global.sqlite3InitModule !== "function") { falha(new Error("assets/sql/sqlite3.js não definiu sqlite3InitModule")); return; }
        global.sqlite3InitModule({
          locateFile: function (f) { return "assets/sql/" + f; },
          print: function () {}, printErr: function () {}
        }).then(ok, falha);
      };
      sc.onerror = function () { falha(new Error("não consegui carregar assets/sql/sqlite3.js")); };
      document.body.appendChild(sc);
    });
    return pMotor;
  }
  function seed() {
    if (pSeed) return pSeed;
    pSeed = fetch(S.seedUrl).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.text();
    }).catch(function (e) {
      throw new Error("não consegui carregar o banco Loja Aurora (" + S.seedUrl + "): " + e.message +
        ". O guia precisa ser aberto por um endereço http(s), não direto do disco.");
    });
    return pSeed;
  }
  function prontos() { return Promise.all([motor(), seed()]); }
  S.prontos = prontos;

  /* =====================================================================
     5. Desenhar o resultado como o guia mostra
     ===================================================================== */
  var MAX_LINHAS_VISIVEIS = 500;
  function htmlTabela(it) {
    var h = '<div class="sql-result-wrap"><table class="sql-result"><thead><tr>';
    it.colunas.forEach(function (c) { h += "<th>" + escHtml(c) + "</th>"; });
    h += "</tr></thead><tbody>";
    it.linhas.slice(0, MAX_LINHAS_VISIVEIS).forEach(function (l) {
      h += "<tr>";
      l.forEach(function (v) { h += v === null ? '<td><em class="sql-null">NULL</em></td>' : "<td>" + escHtml(v) + "</td>"; });
      h += "</tr>";
    });
    h += "</tbody></table></div>";
    var n = it.total != null ? it.total : it.linhas.length;
    h += '<p class="sql-n">' + (n === 1 ? "1 linha" : n + " linhas") +
      (n > MAX_LINHAS_VISIVEIS ? " (mostrando as " + MAX_LINHAS_VISIVEIS + " primeiras)" : "") + "</p>";
    return h;
  }
  function htmlResultado(res) {
    var h = "";
    res.itens.forEach(function (it) {
      if (it.tipo === "select") h += htmlTabela(it);
      else if (it.tipo === "mudanca") h += '<p class="sql-msg">' + escHtml(it.verbo) + ": " + (it.n === 1 ? "1 linha afetada" : it.n + " linhas afetadas") + "</p>";
      else h += '<p class="sql-msg">' + escHtml(it.verbo) + ": ok</p>";
    });
    if (res.erro) h += '<div class="sql-erro">Erro do SQLite: ' + escHtml(res.erro.msg) + "</div>" +
      (res.erro.trava ? '<p class="sql-msg sql-dica">O guia parou este SQL depois de ' + Math.round(S.tempoMax / 1000) +
        " segundos: parece que ele não tem fim (um <code>WITH RECURSIVE</code> sem <code>LIMIT</code>?).</p>" : "");
    if (!h) h = '<p class="sql-msg sql-vazio">(nenhum comando para rodar)</p>';
    return h;
  }
  S.htmlResultado = htmlResultado;

  /* =====================================================================
     6. A caixa .trysql
     ===================================================================== */
  var caixas = [];
  S.caixas = caixas;
  function montar(box) {
    if (box.getAttribute("data-montado")) return;
    box.setAttribute("data-montado", "1");
    var goal = box.getAttribute("data-goal") || "";
    var preSql = box.querySelector("pre.script");
    var preSol = box.querySelector("pre.solucao");
    var nome = (preSql && preSql.getAttribute("data-file")) || "consulta.sql";
    var original = preSql ? lerPre(preSql) : "";
    var solucao = preSol ? lerPre(preSol) : null;
    if (preSql) preSql.style.display = "none";
    if (preSol) preSol.style.display = "none";

    var w = el("div", { "class": "ts sqlsim" });
    w.innerHTML =
      '<div class="ts-bar"><span class="ts-arq">' + escHtml(nome) + '</span><span class="ts-sp"></span>' +
      (solucao !== null ? '<button type="button" class="sim-btn ts-sol">Ver solução</button>' : "") +
      '<button type="button" class="sim-btn ts-rest" title="Volta ao SQL original">Restaurar</button></div>' +
      '<div class="ts-confirma" hidden><span>Trocar o seu SQL pela solução?</span> <button type="button" class="sim-btn2 ts-sim">Sim, mostrar</button> <button type="button" class="sim-btn2 secundario ts-nao">Cancelar</button></div>' +
      '<div class="ts-editor"><pre class="ts-nums" aria-hidden="true"></pre><textarea class="ts-code" spellcheck="false" autocapitalize="off" autocomplete="off" wrap="off" aria-label="SQL para experimentar"></textarea></div>' +
      '<div class="ts-run"><span class="ts-args-l sql-dica">A cada Rodar, o banco Loja Aurora volta ao estado original.</span>' +
      '<button type="button" class="ts-rodar" title="Ctrl+Enter também roda">Rodar ▶</button></div>' +
      '<div class="sql-saida" hidden aria-live="polite"></div>';
    box.appendChild(w);
    var status = null;
    if (goal) {
      status = el("p", { "class": "sim-status", "aria-live": "polite" }, "Missão em andamento… (escreva o SQL e clique em Rodar)");
      box.appendChild(status);
    }

    var ta = w.querySelector(".ts-code"), nums = w.querySelector(".ts-nums");
    var saida = w.querySelector(".sql-saida"), btn = w.querySelector(".ts-rodar");
    var cumprida = false, rodando = false;

    function ajustar() {
      var n = ta.value.split("\n").length, t = "";
      for (var i = 1; i <= n; i++) t += i + "\n";
      nums.textContent = t;
      ta.style.height = "auto";
      ta.style.height = Math.max(ta.scrollHeight, 48) + "px";
    }
    function inserir(txt, a, b) {
      if (ta.setRangeText) ta.setRangeText(txt, a, b, "end");
      else { ta.value = ta.value.slice(0, a) + txt + ta.value.slice(b); ta.selectionStart = ta.selectionEnd = a + txt.length; }
      ajustar();
    }
    ta.addEventListener("input", ajustar);
    ta.addEventListener("keydown", function (e) {
      if (e.key === "Tab" && !e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey) { e.preventDefault(); inserir("  ", ta.selectionStart, ta.selectionEnd); }
      else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); rodarCaixa(); }
      else if (e.key === "Escape") ta.blur();
    });

    function verificar(res) {
      if (!status) return;
      var f = S.falhas(goal, res);
      if (!f.length) { cumprida = true; status.textContent = "✔ Missão cumprida!"; status.className = "sim-status ok"; return; }
      if (cumprida) return; // já cumpriu antes; não volta atrás
      status.className = "sim-status";
      status.innerHTML = "Missão em andamento… <span class=\"sql-falta\">Ainda falta: " +
        f.map(function (x) { return escHtml(x.desc) + (x.motivo ? " <small>(" + escHtml(x.motivo) + ")</small>" : ""); }).join("; ") + "</span>";
    }

    function rodarCaixa() {
      if (rodando) return Promise.resolve(null);
      rodando = true;
      btn.disabled = true;
      saida.hidden = false;
      saida.innerHTML = '<p class="sql-msg sql-vazio">Carregando o SQLite…</p>';
      return prontos().then(function (ms) {
        var res = S.rodar(ms[0], ms[1], ta.value);
        saida.innerHTML = htmlResultado(res);
        if (goal) verificar(res);
        return res;
      }).catch(function (e) {
        saida.innerHTML = '<div class="sql-erro">' + escHtml(e.message || String(e)) + "</div>";
        return null;
      }).finally(function () { rodando = false; btn.disabled = false; });
    }
    btn.addEventListener("click", rodarCaixa);

    w.querySelector(".ts-rest").addEventListener("click", function () {
      ta.value = original; ajustar(); saida.hidden = true; saida.innerHTML = "";
    });
    if (solucao !== null) {
      var conf = w.querySelector(".ts-confirma");
      w.querySelector(".ts-sol").addEventListener("click", function () { conf.hidden = false; });
      w.querySelector(".ts-nao").addEventListener("click", function () { conf.hidden = true; });
      w.querySelector(".ts-sim").addEventListener("click", function () { conf.hidden = true; ta.value = solucao; ajustar(); rodarCaixa(); });
    }

    ta.value = original;
    ajustar();

    var ctrl = {
      box: box, goal: goal, nome: nome,
      codigo: function () { return ta.value; },
      cumprida: function () { return cumprida; },
      /* para o testador: põe o código ("inicial" ou "solucao"), roda e
         devolve { metas, res } */
      testar: function (qual) {
        ta.value = (qual === "solucao" && solucao !== null) ? solucao : original;
        ajustar();
        cumprida = false;
        if (status) { status.className = "sim-status"; status.textContent = "Missão em andamento…"; }
        return rodarCaixa().then(function (res) {
          return { metas: (goal && res) ? S.avaliarMetas(goal, res) : [], res: res };
        });
      }
    };
    caixas.push(ctrl);
    return ctrl;
  }

  /* ---------- pre.file[data-resultado]: o quadro "Resultado" ---------- */
  var resultados = [];
  S.resultados = resultados;
  function montarResultado(pre) {
    if (pre.getAttribute("data-montado")) return;
    pre.setAttribute("data-montado", "1");
    var r = { pre: pre, codigo: lerPre(pre), pronto: null };
    resultados.push(r);
    var caixa = el("div", { "class": "sql-res" },
      '<p class="sql-res-rot">Resultado</p><div class="sql-saida"><p class="sql-msg sql-vazio">Carregando…</p></div>');
    pre.parentNode.insertBefore(caixa, pre.nextSibling);
    var alvo = caixa.querySelector(".sql-saida");
    r.desenhar = function () {
      if (r.pronto) return r.pronto;
      r.pronto = prontos().then(function (ms) {
        var res = S.rodar(ms[0], ms[1], r.codigo);
        alvo.innerHTML = htmlResultado(res);
        return res;
      }).catch(function (e) {
        alvo.innerHTML = '<div class="sql-erro">' + escHtml(e.message || String(e)) + "</div>";
        return null;
      });
      return r.pronto;
    };
    if ("IntersectionObserver" in window && !S.teste) {
      var io = new IntersectionObserver(function (es) { if (es.some(function (x) { return x.isIntersecting; })) { io.disconnect(); r.desenhar(); } }, { rootMargin: "800px 0px" });
      io.observe(pre);
    } else if (!S.teste) r.desenhar();
    return r;
  }

  function montarTudo() {
    Array.prototype.forEach.call(document.querySelectorAll(".trysql"), function (b) {
      try { montar(b); } catch (e) { console.error("sqlsim:", e); }
    });
    Array.prototype.forEach.call(document.querySelectorAll("pre.file[data-resultado]"), function (p) {
      try { montarResultado(p); } catch (e) { console.error("sqlsim:", e); }
    });
    S.montado = true;
  }
  S.montarTudo = montarTudo;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", montarTudo); else montarTudo();
})(typeof globalThis !== "undefined" ? globalThis : this);
