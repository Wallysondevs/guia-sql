# Diferenças: editor do guia (SQLite WASM) × sqlite3 nativo do lab

Mantido pelo `tools/testar-missoes.js --nativo`. O editor (`assets/sql/sqlite3.wasm`) e o lab
(`~/guia-sql-lab/src/sqlite3`) são o **mesmo SQLite 3.50.4**, compilado com as **mesmas opções**
(DQS=0, FTS5, math, dbstat…). Por isso a saída canônica (`.mode list`, NULL vazio) deve ser
idêntica; qualquer diferença aparece abaixo, na seção da página.

## Diferenças conhecidas (esperadas)
| Assunto | Editor do guia | sqlite3 no terminal |
|---|---|---|
| Mensagem de erro | a mensagem crua: `no such table: cliente` | `Parse error: no such table: cliente` (ou `Runtime error: …`; com stdin de arquivo: `Parse error near line 2: …`), às vezes com a seta `^--- error here` |
| Chaves estrangeiras | ligadas: o `aurora.sql` faz `PRAGMA foreign_keys = ON;` | `sqlite3 loja.db` começa com `foreign_keys` **desligado** (`PRAGMA foreign_keys;` → 0): um INSERT com FK inválida passa. O `--nativo` carrega o `aurora.sql`, então não vê esta diferença |
| Código do erro | só a mensagem | erros de execução às vezes ganham o código: `Runtime error: UNIQUE constraint failed: categorias.id (19)` |
| Comandos de ponto (`.tables`) | não existem: erro de sintaxe | funcionam (são do programa sqlite3). O testador não compara SQL com linha começando por `.` |
| `random()`, `datetime('now')` | muda a cada Rodar | muda a cada execução (a comparação dá diferença; não use em página) |
| `EXPLAIN QUERY PLAN` | tabela com as colunas `id`, `parent`, `notused`, `detail` | árvore: `QUERY PLAN` e, embaixo, `` `--SCAN pedidos `` (o testador converte a tabela do editor em árvore antes de comparar; `EXPLAIN` puro não é comparado) |
| Extensões que só o programa sqlite3 traz | não existem: `no such table: generate_series`, `no such function: REGEXP`, `median`, `percentile`, `base64`, `sha3`, `decimal_add`, `readfile`… | funcionam: o shell `sqlite3` embute essas extensões; a biblioteca SQLite (a do editor, a dos apps) não. **Aparecem como diferença de verdade**: não use em `.trysql`/`data-resultado` (no editor só com `data-erro`, mostrando o erro) |
| SQL sem fim | interrompido em ~4 s com `interrupted` | roda até alguém apertar Ctrl+C |
| Tabela grande | desenha até 500 linhas (as metas contam todas) | mostra todas |
| Cabeçalho e formato | tabela HTML com cabeçalho | `.mode list` sem cabeçalho, até mudar com `.mode`/`.headers` |

O testador desconta as diferenças de formato (mensagem de erro, comandos de ponto, `EXPLAIN QUERY PLAN`, a trava): compara a mensagem de erro só pelo miolo (a do editor tem de aparecer dentro da do terminal). As extensões só do terminal aparecem como diferença de verdade.

## Diferenças encontradas
<!-- AUTO: cada página tem a sua seção, reescrita a cada --nativo. Página sem diferença não aparece. -->

<!-- pagina:cte-recursiva.html -->
### cte-recursiva.html (2026-10-18 13:44 UTC)

**resultado 13 (linha 318)** — saída diferente; o editor deu erro e o nativo não

```sql
SELECT value FROM generate_series(1, 3);
```

- editor: erro `no such table: generate_series`; saída:

```

```
- sqlite3 nativo (status 0): saída:

```
1
2
3
```
<!-- /pagina:cte-recursiva.html -->

<!-- pagina:comentarios.html -->
### comentarios.html (2026-10-18 13:52 UTC)

**resultado 11 (linha 246)** — saída diferente; o editor deu erro e o nativo não

```sql
# comentário estilo MySQL
SELECT 1;
```

- editor: erro `unrecognized token: "#"`; saída:

```

```
- sqlite3 nativo (status 0): saída:

```
1
```
<!-- /pagina:comentarios.html -->
