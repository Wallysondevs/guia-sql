# Estado do SIMULADOR (agente do sqlsim) — 18/10

## Ferramentas (todas na VPS, em ~/guia-sql; Node 24: rode `. ~/.profile` antes)
| Comando | O que faz |
|---|---|
| `timeout 900 node tools/testar-missoes.js [-q] [--nativo] pagina.html…` | Testador de missões (sem navegador, ~0,5 s por página). `--todas` = todas as .html da raiz. Saída: uma linha por item (`ok`/`FALHA`/`aviso`, com a linha do HTML). Código 0 = sem FALHA, 1 = FALHA, 2 = página não encontrada. Do notebook: `~/guia-sql-lab/testar [--nativo] [-q] pagina.html`. |
| `timeout 900 node tools/testar-navegador.js [-q] [--fotos DIR] pagina.html…\|--todas` | Chromium headless de verdade (puppeteer-core de `~/rascunho/coord/cdp/node_modules`, `/usr/bin/chromium`). Sobe um servidor HTTP próprio em 127.0.0.1 com porta escolhida pelo sistema (morre com o script; nada de pkill). Por página: erro de JS/console/HTTP, menu, caixas montadas, `SQLSim.caixas[i].testar("inicial"/"solucao")`, rola até cada `pre.file[data-resultado]` (caminho preguiçoso real) e confere o desenho e o `data-erro`. Na `simulador-teste-interno.html` faz também o teste de interface com cliques reais. `--todas` nas 80 páginas de hoje: 1 min 20 s, 0 problemas. |
| `node tools/sim.js [--canonico] [--goal META] arquivo.sql\|-` | Roda um SQL como o editor (do coordenador; só mudei a contagem de linhas para usar `total`). |
| `tools/motor-node.js` | Carrega o wasm + aurora.sql no Node (interface intacta). |

### O que o testar-missoes confere
- `.trysql`: meta conhecida/regex válida, um só `pre.script`, missão com `pre.solucao`, inicial NÃO cumpre, solução cumpre; caixa livre roda sem erro (ou `data-erro` na div).
- `pre.file[data-resultado]`: erro só com `data-erro`; `data-erro` sem erro = FALHA.
- Todo `<pre>`: `<` e `&` sem escape = FALHA (o `>` pode ficar cru); entidade desconhecida em pre de código = FALHA.
- Privacidade (`/home/admin`, `wallyson` exceto `wallysondevs.github.io`, `ip-172-`, o IP da VPS, `guia-sql-lab`) = FALHA. Link para fora da NIVEIS, SQL > 1,5 s, SELECT > 500 linhas, página sem missão = aviso.
- `--nativo`: roda cada SQL em `~/guia-sql-lab/src/sqlite3 -bail -batch -cmd ".read aurora.sql" :memory:` e compara com a saída canônica (o EXPLAIN QUERY PLAN do editor é convertido na árvore do CLI; SQL com comando de ponto e a trava não são comparados). Diferença = aviso + seção da página em `tools/DIFERENCAS.md` (reescrita a cada run, com trava `.lock`; o cabeçalho sempre vem do testador). **Os autores rodam --nativo e o arquivo muda sozinho: o coordenador commita o DIFERENCAS.md quando quiser.**
- Páginas de teste do próprio testador: `tools/teste/erros-de-proposito.html` (12 FALHAs esperadas, uma de cada tipo), `tools/teste/nativo-bateria.html` (formatos de número, math, JSON, FTS5, dbstat, datas, erros: 0 diferenças), `tools/teste/wallyson.html` (2 FALHAs esperadas).

## PRONTO (commits de 18/10)
- 480fd75 testar-missoes.js + páginas de teste + DIFERENCAS.md
- 23eaa64 SELECT que dá erro antes da 1ª linha não desenha tabela vazia (como o CLI)
- 762cb2a / ff1aff4 / d43ed28 §5 do CONTRIBUINDO: mensagens editor × terminal (exemplos reais), foreign_keys, EXPLAIN QUERY PLAN, funções só do sqlite3, escape, `data-erro`, erro em várias linhas, testador; o `\|` da tabela de metas saiu da tabela (vira nota).
- d5b0054 testar-navegador.js + simulador-teste-interno.html (fora da NIVEIS, `noindex`); trava mostra explicação em português.
- 84ac6a7 páginas **index.html** e **simulador.html**; sqlsim conta todas as linhas mas guarda só 20 000 (`SQLSim.maxGuardar`; item select ganhou `total`); --nativo entende EQP.
- d43ed28 filtro libera wallysondevs.github.io; o editor tira espaços/quebras do fim do SQL antes de rodar (a mensagem da aspa sem fechar fica igual à do terminal).

## Diferenças editor × sqlite3 achadas (detalhes em DIFERENCAS.md e §5)
- Saída canônica: **zero** diferenças em todas as 80 páginas (mesmo 3.50.4, mesmas opções).
- Mensagem de erro: o CLI põe `Parse error:`/`Runtime error:` (stdin de arquivo: `… near line N:`; argumento: `Error: in prepare, …`), a seta `^--- error here` e às vezes o código `(19)`.
- `sqlite3 loja.db` começa com `foreign_keys` = 0; o editor (aurora.sql) liga. INSERT com FK ruim / `DELETE FROM produtos` passam no terminal e falham no editor.
- EXPLAIN QUERY PLAN: tabela crua no editor, árvore no CLI. (As páginas indices/union-all/explain descrevem a tabela do editor; se um dia o editor desenhar a árvore, o texto delas muda — decisão do coordenador.)
- Extensões só do shell sqlite3: generate_series, REGEXP, median, percentile, base64, sha3, decimal_*, readfile… (no editor: no such table/function).

## Limitações conhecidas (para os autores)
- O SQL roda na thread principal: durante a trava (4 s) a página fica parada. Por isso exemplo sem fim deve ser `.trysql` (o leitor clica), nunca `pre.file data-resultado` (travaria a rolagem).
- De um SELECT gigante, só as 20 000 primeiras linhas entram na saída canônica (as metas `linhas:` contam todas).
- `random()`/`date('now')` mudam a cada Rodar.
- No Chromium da VPS falta a fonte de emoji (o 📄 do nome do arquivo vira um quadradinho nos prints); nos navegadores normais aparece.

## FALTA / ideias
- Opcional: rodar o SQL num Web Worker (não travar a página durante a trava de 4 s).
- Opcional: desenhar EXPLAIN QUERY PLAN como árvore no editor (combinar com os autores de indices/union-all/explain).
- O coordenador roda `testar-navegador.js --todas` no fim (as 122 páginas).

Arquivos meus: assets/sqlsim.js, assets/sql/{sqlite3.js,sqlite3.wasm,VERSAO.txt}, assets/style.css (bloco /* sqlsim */), CONTRIBUINDO.md §5, tools/{testar-missoes.js,testar-navegador.js,ESTADO.md,DIFERENCAS.md,teste/}, simulador-teste-interno.html, simulador.html, index.html.
