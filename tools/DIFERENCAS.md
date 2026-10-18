# Diferenças: editor do guia (SQLite WASM) × sqlite3 nativo do lab

Mantido pelo `tools/testar-missoes.js --nativo`. O editor (`assets/sql/sqlite3.wasm`) e o lab
(`~/guia-sql-lab/src/sqlite3`) são o **mesmo SQLite 3.50.4**, compilado com as **mesmas opções**
(DQS=0, FTS5, math, dbstat…). Por isso a saída canônica (`.mode list`, NULL vazio) deve ser
idêntica; qualquer diferença aparece abaixo, na seção da página.

## Diferenças conhecidas (esperadas, não aparecem como diferença)
| Assunto | Editor do guia | sqlite3 no terminal |
|---|---|---|
| Mensagem de erro | a mensagem crua: `no such table: cliente` | `Parse error: no such table: cliente` (ou `Runtime error: …`; com stdin de arquivo: `Parse error near line 2: …`), às vezes com a seta `^--- error here` |
| Comandos de ponto (`.tables`) | não existem: erro de sintaxe | funcionam (são do programa sqlite3) |
| SQL sem fim | interrompido em ~4 s com `interrupted` | roda até alguém apertar Ctrl+C |
| Tabela grande | desenha até 500 linhas (as metas contam todas) | mostra todas |
| Cabeçalho e formato | tabela HTML com cabeçalho | `.mode list` sem cabeçalho, até mudar com `.mode`/`.headers` |

O testador compara a mensagem de erro só pelo miolo (a do editor tem de aparecer dentro da do terminal).

## Diferenças encontradas
<!-- AUTO: cada página tem a sua seção, reescrita a cada --nativo. Página sem diferença não aparece. -->

<!-- pagina:nativo-bateria.html -->
### nativo-bateria.html (2026-10-18 13:22 UTC)

**resultado 10 (linha 39)** — saída diferente; o editor deu erro e o nativo não

```sql
SELECT 1;
.tables
```

- editor: erro `near ".": syntax error`; saída:

```
1
```
- sqlite3 nativo (status 0): saída:

```
1
categorias    fornecedores  itens_pedido  produtos    
clientes      funcionarios  pedidos     
```
<!-- /pagina:nativo-bateria.html -->
