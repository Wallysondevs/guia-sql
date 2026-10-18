# Estado do SIMULADOR (agente do sqlsim) — fim do dia 17/10

## PRONTO (commitado e testado no Node)
- **Motor vendorizado**: `assets/sql/sqlite3.js` + `sqlite3.wasm` = **SQLite WASM 3.50.4 oficial** (zip `https://sqlite.org/2025/sqlite-wasm-3500400.zip`). Versão anotada em `assets/sql/VERSAO.txt`. Decisão: a série oficial 3.50.x termina na 3.50.4; o "3.50.4" do host é o binário do Android platform-tools (único `sqlite3` no PATH: `/opt/oficial-sdk/platform-tools/sqlite3`). Sem OPFS/COOP/COEP: banco efêmero em memória.
- **`assets/sqlsim.js`** (commit 733f137): núcleo + UI.
  - `SQLSim.rodar(sqlite3, seed, sql)`: banco novo `:memory:`, roda `aurora.sql`, executa o SQL do aluno statement a statement via `capi.sqlite3_prepare_v3` com `pzTail` (valores via `sqlite3_column_text` → **texto formatado pelo próprio SQLite**, igual ao CLI). Devolve `{itens, erro, canonico, ultimo, estado:{tabelas:{nome:n}}}`. Saída canônica = todas as linhas dos SELECTs em `.mode list` (`|`, NULL→vazio). Trava anti-loop: `sqlite3_progress_handler`, aborta com `interrupted` após `SQLSim.tempoMax` (4 s).
  - Metas: `SQLSim.avaliarMetas(goal, res)` — `out:`, `linhas:`, `colunas:` (`\,` = vírgula literal), `contem:`, `erro:`/`erro:RE`, `tabela:`, `mudou:tab=N`, combinadas com `;;`. Com erro de SQL, só `erro:` passa. Contrato publicado na §5 do CONTRIBUINDO.md.
  - UI: caixa `.trysql` (textarea com números de linha, Rodar/Ctrl+Enter, Restaurar, "Ver solução" com confirmação, `sim-status` da missão) e `pre.file[data-resultado]` (quadro "Resultado" rodando o SQL de verdade, lazy via IntersectionObserver; `?sqlsim-teste` desliga o lazy). Solução = `pre.solucao` (padrão guia-html, NÃO comentário HTML). Cada caixa expõe `ctrl.testar("inicial"|"solucao")` → Promise `{metas,res}` em `SQLSim.caixas` (p/ teste no navegador).
  - Carga: motor+seed só no primeiro uso; `fetch('assets/sql/aurora.sql')` com cache de promise; mensagem amigável se abrir via file:// .
  - **No Node**: `require('./assets/sqlsim.js')` exporta o módulo puro (sem DOM). Inicializar o motor assim:
    ```js
    require('/home/admin/guia-sql/assets/sql/sqlite3.js');          // define globalThis.sqlite3InitModule
    globalThis.sqlite3InitModule({ wasmBinary: fs.readFileSync('.../sqlite3.wasm'), print(){}, printErr(){} })
    ```
    (o `module.exports` do glue NÃO serve; use a global. Testado ok: ver /tmp/sqlwasm/t2.js desta sessão — 10 casos passando, inclusive trava e metas.)
- **CSS**: bloco `/* sqlsim */` no FIM de `assets/style.css` (`.trysql`, `table.sql-result`, `.sql-null`, `.sql-erro`, `.sql-msg`, `.sql-res`...). As classes `.ts-*` do editor já existiam.
- **CONTRIBUINDO.md §5**: contrato completo das metas + saída canônica + como o testador vai funcionar (commit 7634e50).

## FALTA (próximos passos, em ordem)
1. **`tools/testar-missoes.js`** (Node 24, sem npm): extrair cada `.trysql` do HTML por regex (`<div class="trysql"[^>]*>...</div>` — as caixas não têm div aninhado), decodificar entidades HTML (&lt; &gt; &amp; &quot;), ler `data-goal`, `pre.script`, `pre.solucao`; conferir contrato (meta válida, missão tem solução); rodar inicial (meta deve FALHAR) e solução (deve PASSAR) com `SQLSim.rodar`/`avaliarMetas`; rodar também cada `pre.file[data-resultado]` e acusar erro de SQL — exceto se o `pre` tiver `data-erro` (convenção já documentada na §5!). `--nativo`: rodar seed+sql no sqlite3 do host (`/opt/oficial-sdk/platform-tools/sqlite3 :memory:` com `-bail -batch`, stdin) e comparar stdout com `res.canonico`; registrar diferenças em `tools/DIFERENCAS.md` (criar; anotar lá também a questão 3.50.4 wasm × "3.50.4" oficial).
2. **`tools/sim.js arquivo.sql`**: carrega motor+seed, `SQLSim.rodar`, imprime colunas, linhas em `.mode list`, "N linha(s) afetada(s)" e erro — para os autores colherem saídas.
3. **Página `simulador-teste-interno.html`** (NÃO entra na NIVEIS): algumas caixas `.trysql` (livre, com missão boa, com meta que o inicial não cumpre, com erro:) + `pre.file[data-resultado]`. Testar no Chromium headless da VPS: helper `~/rascunho/coord/cdp/navegador.js` (puppeteer-core instalado) — ainda NÃO estudei esse helper. Precisa servir por HTTP (wasm não carrega de file://): subir servidor estático Node em 127.0.0.1 porta alta durante o teste, com timeout, e matar com kill $! (nunca pkill). Clicar Rodar de verdade e conferir a `table.sql-result` renderizada; `?sqlsim-teste` + `SQLSim.caixas[i].testar(...)` ajudam.
4. Detalhe de doc: na tabela de metas da §5 do CONTRIBUINDO.md, a célula do `out:` precisa render certo: no fonte Markdown o primeiro code-span deveria ser "\\|" (barra+pipe escapado) para RENDERIZAR `\|`; hoje os três aparecem como `|`. Corrigir quando mexer lá.
5. Avisar o coordenador quando o testador existir (o RECURSOS.md promete `~/guia-sql-lab/testar`, que embrulha o testar-missoes.js).

## Como conferir rápido amanhã
```bash
cd /home/admin/guia-sql && git log --oneline | head -5
node /tmp/sqlwasm/t2.js   # se /tmp sobreviveu; senão recriar a partir do padrão acima
```
Nenhum arquivo meu fora de: assets/sqlsim.js, assets/sql/{sqlite3.js,sqlite3.wasm,VERSAO.txt}, assets/style.css (só o bloco final), CONTRIBUINDO.md (§5), tools/ESTADO.md.
