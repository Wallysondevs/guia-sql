# Diferenças: editor do guia (SQLite WASM) × sqlite3 nativo do lab

Mantido pelo `tools/testar-missoes.js --nativo`. O editor (`assets/sql/sqlite3.wasm`) e o lab
(`~/guia-sql-lab/src/sqlite3`) são o **mesmo SQLite 3.50.4**. O do lab foi compilado com as opções
do **pacote sqlite3 do Debian 13** (o que o leitor tem no terminal); o do editor, com as do wasm
oficial. A saída canônica (`.mode list`, NULL vazio) é idêntica, menos nas diferenças da tabela
abaixo; qualquer outra aparece na seção da página.

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
| Aspas duplas (`"Ana"`) | **erro**: o wasm tem DQS=0 — `no such column: "Ana" - should this be a string literal in single-quotes?` | viram **texto** sem aviso (DQS ligado, como no Debian/Ubuntu), se não houver coluna com esse nome |
| `DELETE … LIMIT`, `soundex()` | erro de sintaxe / `no such function` | funcionam (o Debian compila com UPDATE_DELETE_LIMIT e SOUNDEX) |
| Banco novo (arquivo) | em memória: `page_size` 8192 | `page_size` 4096, `auto_vacuum` 0 (o `loja.db` tem 45056 bytes, 11 páginas) |
| SQL sem fim | interrompido em ~4 s com `interrupted` | roda até alguém apertar Ctrl+C |
| Tabela grande | desenha até 500 linhas (as metas contam todas) | mostra todas |
| Cabeçalho e formato | tabela HTML com cabeçalho | `.mode list` sem cabeçalho, até mudar com `.mode`/`.headers` |

O testador desconta as diferenças de formato (mensagem de erro, comandos de ponto, `EXPLAIN QUERY PLAN`, a trava): compara a mensagem de erro só pelo miolo (a do editor tem de aparecer dentro da do terminal). As extensões só do terminal aparecem como diferença de verdade.

## Diferenças encontradas
<!-- AUTO: cada página tem a sua seção, reescrita a cada --nativo. Página sem diferença não aparece. -->

<!-- pagina:between.html -->
### between.html (2026-10-18 14:15 UTC)

**resultado 24 (linha 347)** — saída diferente; o editor deu erro e o nativo não

```sql
SELECT id, data FROM pedidos
WHERE data BETWEEN "2026-01-01" AND "2026-03-31";
```

- editor: erro `no such column: "2026-01-01" - should this be a string literal in single-quotes?`; saída:

```

```
- sqlite3 nativo (status 0): saída:

```
65|2026-01-08
66|2026-01-20
67|2026-02-02
68|2026-02-13
69|2026-02-25
70|2026-03-09
71|2026-03-20
```
<!-- /pagina:between.html -->

<!-- pagina:comentarios.html -->
### comentarios.html (2026-10-18 14:15 UTC)

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

<!-- pagina:cte-recursiva.html -->
### cte-recursiva.html (2026-10-18 14:15 UTC)

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

<!-- pagina:datas.html -->
### datas.html (2026-10-18 14:15 UTC)

**resultado 19 (linha 400)** — saída diferente; o editor deu erro e o nativo não

```sql
SELECT COUNT(*) AS pedidos
FROM pedidos
WHERE data = "2024-01-05";
```

- editor: erro `no such column: "2024-01-05" - should this be a string literal in single-quotes?`; saída:

```

```
- sqlite3 nativo (status 0): saída:

```
1
```
<!-- /pagina:datas.html -->

<!-- pagina:funcoes-texto.html -->
### funcoes-texto.html (2026-10-18 14:15 UTC)

**resultado 20 (linha 347)** — saída diferente; o editor deu erro e o nativo não

```sql
SELECT nome
FROM clientes
WHERE cidade = "Teresina";
```

- editor: erro `no such column: "Teresina" - should this be a string literal in single-quotes?`; saída:

```

```
- sqlite3 nativo (status 0): saída:

```
José Ribamar Silva
Maria Clara Mendes
Conceição Prado
Antônio Carlos Neves
Tiago Fontes
Larissa Macêdo
Ana Carvalho Lima
Henrique Sales
Otávio Bezerra
Elias Furtado
```
<!-- /pagina:funcoes-texto.html -->

<!-- pagina:indices-na-pratica.html -->
### indices-na-pratica.html (2026-10-18 14:15 UTC)

**resultado 2 (linha 172)** — saída diferente

```sql
CREATE TABLE vendas (id INTEGER PRIMARY KEY, cliente_id INTEGER, produto_id INTEGER,
                     data TEXT, pago INTEGER, valor REAL);
INSERT INTO vendas
WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM n WHERE i < 10000)
SELECT i, (i * 7919) % 50000 + 1, (i * 31) % 45 + 1,
       date('2021-01-01', '+' || (i % 2000) || ' days'),
       i % 2, round((i * 37) % 50000 / 100.0, 2)
FROM n;
CREATE INDEX idx_vendas_pago ON vendas(pago);

SELECT name, SUM(pgsize) AS bytes
FROM dbstat
WHERE name LIKE '%vendas%'
GROUP BY name;
```

- editor: saída:

```
idx_vendas_pago|90112
vendas|344064
```
- sqlite3 nativo (status 0): saída:

```
idx_vendas_pago|86016
vendas|339968
```
<!-- /pagina:indices-na-pratica.html -->

<!-- pagina:insert.html -->
### insert.html (2026-10-18 14:15 UTC)

**caixa 2, SQL inicial (linha 354)** — mensagem de erro diferente

```sql
INSERT INTO clientes (nome, email, cidade)
VALUES ("Lívia Rocha", 'livia.rocha@exemplo.com.br');

SELECT * FROM clientes WHERE id >= 30;
```

- editor: erro `no such column: "Lívia Rocha" - should this be a string literal in single-quotes?`; saída:

```

```
- sqlite3 nativo (status 1): saída:

```

```
  stderr:

```
Parse error near line 1: 2 values for 3 columns
```
<!-- /pagina:insert.html -->

<!-- pagina:json.html -->
### json.html (2026-10-18 14:15 UTC)

**resultado 32 (linha 562)** — saída diferente; o editor deu erro e o nativo não

```sql
SELECT json_object("nome", 'Ana');
```

- editor: erro `no such column: "nome" - should this be a string literal in single-quotes?`; saída:

```

```
- sqlite3 nativo (status 0): saída:

```
{"nome":"Ana"}
```
<!-- /pagina:json.html -->

<!-- pagina:like.html -->
### like.html (2026-10-18 14:15 UTC)

**resultado 17 (linha 308)** — saída diferente; o editor deu erro e o nativo não

```sql
SELECT nome FROM clientes WHERE nome LIKE "Ana%";
```

- editor: erro `no such column: "Ana%" - should this be a string literal in single-quotes?`; saída:

```

```
- sqlite3 nativo (status 0): saída:

```
Ana Beatriz Sousa
Ana Carvalho Lima
```
<!-- /pagina:like.html -->

<!-- pagina:not-null.html -->
### not-null.html (2026-10-18 14:15 UTC)

**resultado 17 (linha 326)** — o editor deu erro e o nativo não

```sql
INSERT INTO clientes (nome, email)
VALUES ('Rita Moura', "rita@exemplo.com.br");
```

- editor: erro `no such column: "rita@exemplo.com.br" - should this be a string literal in single-quotes?`; saída:

```

```
- sqlite3 nativo (status 0): saída:

```

```
<!-- /pagina:not-null.html -->

<!-- pagina:o-que-e-sql.html -->
### o-que-e-sql.html (2026-10-18 14:15 UTC)

**caixa 2, SQL inicial (linha 234)** — saída diferente; o editor deu erro e o nativo não

```sql
SELECT nome, preco
FROM produtos
WHERE nome = "Lápis Grafite HB";
```

- editor: erro `no such column: "Lápis Grafite HB" - should this be a string literal in single-quotes?`; saída:

```

```
- sqlite3 nativo (status 0): saída:

```
Lápis Grafite HB|1.15
```

**resultado 11 (linha 226)** — saída diferente; o editor deu erro e o nativo não

```sql
SELECT nome, preco
FROM produtos
WHERE nome = "Lápis Grafite HB";
```

- editor: erro `no such column: "Lápis Grafite HB" - should this be a string literal in single-quotes?`; saída:

```

```
- sqlite3 nativo (status 0): saída:

```
Lápis Grafite HB|1.15
```
<!-- /pagina:o-que-e-sql.html -->

<!-- pagina:projeto-loja.html -->
### projeto-loja.html (2026-10-18 14:15 UTC)

**resultado 19 (linha 916)** — o editor deu erro e o nativo não

```sql
INSERT INTO categorias (id, nome) VALUES (9, "Pet Shop");
```

- editor: erro `no such column: "Pet Shop" - should this be a string literal in single-quotes?`; saída:

```

```
- sqlite3 nativo (status 0): saída:

```

```
<!-- /pagina:projeto-loja.html -->

<!-- pagina:ref-erros.html -->
### ref-erros.html (2026-10-18 14:15 UTC)

**resultado 4 (linha 140)** — saída diferente; o editor deu erro e o nativo não

```sql
SELECT nome, email
FROM clientes
WHERE nome = "Ana Carvalho Lima";
```

- editor: erro `no such column: "Ana Carvalho Lima" - should this be a string literal in single-quotes?`; saída:

```

```
- sqlite3 nativo (status 0): saída:

```
Ana Carvalho Lima|ana.carvalho@exemplo.com.br
```
<!-- /pagina:ref-erros.html -->

<!-- pagina:sql-injection.html -->
### sql-injection.html (2026-10-18 14:15 UTC)

**resultado 7 (linha 327)** — saída diferente; o editor deu erro e o nativo não

```sql
SELECT nome FROM clientes WHERE email = "ana.beatriz@exemplo.com.br";
```

- editor: erro `no such column: "ana.beatriz@exemplo.com.br" - should this be a string literal in single-quotes?`; saída:

```

```
- sqlite3 nativo (status 0): saída:

```
Ana Beatriz Sousa
```
<!-- /pagina:sql-injection.html -->

<!-- pagina:sql-server.html -->
### sql-server.html (2026-10-18 14:15 UTC)

**resultado 1 (linha 127)** — saída diferente; o editor deu erro e o nativo não

```sql
SELECT nome FROM clientes WHERE id = 1
GO
```

- editor: erro `near "GO": syntax error`; saída:

```

```
- sqlite3 nativo (status 0): saída:

```
José Ribamar Silva
```

**resultado 19 (linha 541)** — saída diferente; o editor deu erro e o nativo não

```sql
SELECT nome FROM clientes WHERE cidade = "Teresina";
```

- editor: erro `no such column: "Teresina" - should this be a string literal in single-quotes?`; saída:

```

```
- sqlite3 nativo (status 0): saída:

```
José Ribamar Silva
Maria Clara Mendes
Conceição Prado
Antônio Carlos Neves
Tiago Fontes
Larissa Macêdo
Ana Carvalho Lima
Henrique Sales
Otávio Bezerra
Elias Furtado
```
<!-- /pagina:sql-server.html -->

<!-- pagina:where.html -->
### where.html (2026-10-18 14:19 UTC)

**caixa 3, SQL inicial (linha 335)** — saída diferente; o editor deu erro e o nativo não

```sql
SELECT nome, cidade
FROM clientes
WHERE cidade = "Recife";
```

- editor: erro `no such column: "Recife" - should this be a string literal in single-quotes?`; saída:

```

```
- sqlite3 nativo (status 0): saída:

```
Juliana Paes Barbosa|Recife
Bruno Cavalcante|Recife
```

**resultado 12 (linha 265)** — saída diferente; o editor deu erro e o nativo não

```sql
SELECT nome, preco
FROM produtos
WHERE nome = "Mouse Sem Fio";
```

- editor: erro `no such column: "Mouse Sem Fio" - should this be a string literal in single-quotes?`; saída:

```

```
- sqlite3 nativo (status 0): saída:

```
Mouse Sem Fio|59.95
```
<!-- /pagina:where.html -->

<!-- pagina:pragma.html -->
### pragma.html (2026-10-18 14:22 UTC)

**resultado 9 (linha 286)** — saída diferente

```sql
PRAGMA page_size;
PRAGMA page_count;
```

- editor: saída:

```
8192
9
```
- sqlite3 nativo (status 0): saída:

```
4096
11
```
<!-- /pagina:pragma.html -->

<!-- pagina:vacuum.html -->
### vacuum.html (2026-10-18 14:22 UTC)

**caixa 1, SQL inicial (linha 143)** — saída diferente

```sql
CREATE TABLE historico (id INTEGER PRIMARY KEY, evento TEXT);
WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM n WHERE i < 20000)
INSERT INTO historico
SELECT i, 'visita ao produto ' || (i % 45 + 1) || ' registrada pelo site da loja' FROM n;

DELETE FROM historico;

SELECT page_count, freelist_count FROM pragma_page_count, pragma_freelist_count;
```

- editor: saída:

```
150|140
```
- sqlite3 nativo (status 0): saída:

```
293|281
```

**caixa 1, solução (linha 154)** — saída diferente

```sql
CREATE TABLE historico (id INTEGER PRIMARY KEY, evento TEXT);
WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM n WHERE i < 20000)
INSERT INTO historico
SELECT i, 'visita ao produto ' || (i % 45 + 1) || ' registrada pelo site da loja' FROM n;

DELETE FROM historico;

VACUUM;
SELECT page_count, freelist_count FROM pragma_page_count, pragma_freelist_count;
```

- editor: saída:

```
10|0
```
- sqlite3 nativo (status 0): saída:

```
12|0
```

**resultado 1 (linha 127)** — saída diferente

```sql
CREATE TABLE historico (id INTEGER PRIMARY KEY, evento TEXT);
WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM n WHERE i < 20000)
INSERT INTO historico
SELECT i, 'visita ao produto ' || (i % 45 + 1) || ' registrada pelo site da loja' FROM n;

SELECT page_count, freelist_count FROM pragma_page_count, pragma_freelist_count;

DROP TABLE historico;
SELECT page_count, freelist_count FROM pragma_page_count, pragma_freelist_count;

VACUUM;
SELECT page_count, freelist_count FROM pragma_page_count, pragma_freelist_count;
```

- editor: saída:

```
150|0
150|141
9|0
```
- sqlite3 nativo (status 0): saída:

```
293|0
293|282
11|0
```
<!-- /pagina:vacuum.html -->

<!-- pagina:postgresql.html -->
### postgresql.html (2026-10-18 14:23 UTC)

**resultado 2 (linha 235)** — saída diferente; o editor deu erro e o nativo não

```sql
SELECT nome FROM clientes WHERE cidade = "Teresina";
```

- editor: erro `no such column: "Teresina" - should this be a string literal in single-quotes?`; saída:

```

```
- sqlite3 nativo (status 0): saída:

```
José Ribamar Silva
Maria Clara Mendes
Conceição Prado
Antônio Carlos Neves
Tiago Fontes
Larissa Macêdo
Ana Carvalho Lima
Henrique Sales
Otávio Bezerra
Elias Furtado
```
<!-- /pagina:postgresql.html -->
